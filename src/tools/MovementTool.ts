import { grid, Cell, SnapTo, Point } from '@davidsev/owlbear-utils';
import { getId } from '@/utils/getId';

import OBR, {
    Command,
    buildPath,
    PathCommand,
    buildLabel,
    Item
} from '@owlbear-rodeo/sdk';

import { DummyCell } from '@/utils/DummyCell';

let _lastHoveredImageId: string | null = null;
let _outlines: Cell[] = [];
let _interaction: any = null;
let cellWidth: number = 0;
let cellHeight: number = 0;

/**
 * Initializes the MovementTool, enabling the movement and confirmation modes
 * for item interaction in the scene. Registers event listeners for tool mode 
 * changes, tool moves, and tool clicks. Handles the logic for building and 
 * interacting with movement paths and confirming movements of characters 
 * within the grid.
 */

export function MovementTool() {
    
    OBR.tool.onToolModeChange(async (mode) => {
        if (_interaction && mode !== getId('movement-mode') && mode !== getId('movement-confirm')) {  
            const [, stop] = _interaction;
            stop();
            _interaction = null;
            _lastHoveredImageId = null;
            _outlines = [];
        }
    })

    OBR.tool.createMode({
        id: getId('movement-mode'),
        icons: [
            {
                icon: '/move-icon.svg',
                label: 'Movement Mode',
            }
        ],
        cursors: [
            {
                cursor: 'pointer',
            }
        ],
        shortcut: 'Shift+D',
        onToolMove: async (_, event) => {
            await renderCells();
        },
        onToolClick: async (_, event) => {
            if(!_interaction)
            {
                const [path, arrow, label] = await buildElements();
    
                _interaction = await OBR.interaction.startItemInteraction([path, arrow, label] as Item[]);
            }

            const { x, y } = event.pointerPosition;

            const character = await pointerNearCharacter(x, y);

            const characterPos = character?.center ?? { x: 0, y: 0 } as Point;
            if(character && _outlines.length == 0)
            {
                const nearCell: DummyCell = new DummyCell(characterPos, cellWidth);
                _outlines.push(nearCell);

                if (_lastHoveredImageId === character.id) return;
                _lastHoveredImageId = character.id;    
            }
                
            const isNearOtherPoint = await isPointerNearLastOutline(x, y);
            if(!character && _outlines.length != 0 && isNearOtherPoint)
            {
                const nearCell = grid.getCell(grid.snapTo({ x, y }, SnapTo.CENTER));

                const index = _outlines.findIndex(c =>
                    Math.abs(c.center.x - nearCell.center.x) < 0.5 &&
                    Math.abs(c.center.y - nearCell.center.y) < 0.5
                );
                
                if (index !== -1) {
                    _outlines.splice(index, 1);
                    await renderCells();
                } else {
                    _outlines.push(nearCell);
                    await renderCells();
                }
            }
        }
    });

    OBR.tool.createMode({
        id: getId('movement-confirm'),
        icons: [
            {
                icon: '/confirm-icon.svg',
                label: 'Confirm Movement',
            }
        ],
        shortcut: 'Shift+C',
        onActivate: async () => {
            if(!_interaction) return;
            const [, stop] = _interaction;
            stop();

            await movePlayer(_lastHoveredImageId, _outlines);

            _interaction = null;
            _lastHoveredImageId = null;
            _outlines = [];

        }
    });
}

/**
 * Build two elements: a yellow highlight path and a red arrow.
 * The arrow is used to show the direction of the character's movement.
 * The highlight path is used to show the path that the character took.
 * @returns {Item[]} An array containing the two built items.
 */
async function buildElements()
{
    const playerColor = await OBR.player.getColor();

    const pathBuilder = buildPath();
    pathBuilder.position({ x: 0, y: 0 });
    pathBuilder.metadata({ createdBy: getId() });
    pathBuilder.strokeWidth(2);
    pathBuilder.layer("DRAWING");
    pathBuilder.name("Cthulhu Highlight");
    pathBuilder.strokeColor(playerColor);
    pathBuilder.fillColor(hexToRgba(playerColor, 0.4));
    pathBuilder.commands([]);

    const arrowBuilder = buildPath();
    arrowBuilder.position({ x: 0, y: 0 });
    arrowBuilder.metadata({ createdBy: getId() });
    arrowBuilder.strokeColor("red");
    arrowBuilder.strokeWidth(4);
    arrowBuilder.fillOpacity(0);
    arrowBuilder.layer("DRAWING");
    arrowBuilder.name("Cthulhu Arrow");
    arrowBuilder.commands([]);

    const label = buildLabel().plainText("");
    label.position({ x: 0, y: 0 });
    label.metadata({ createdBy: getId() });
    label.pointerWidth(0);
    label.pointerHeight(0);
    label.locked(true);
    label.layer("DRAWING");
    label.name("Cthulhu Label");

    const path = pathBuilder.build();
    const arrow = arrowBuilder.build();
    const labelItem = label.build();

    return [path, arrow, labelItem];
}

async function renderCells() {
    if(!_interaction) return;

    OBR.player.select([_lastHoveredImageId ?? ""]);

    const pathCommands: PathCommand[] = [];

    for (const group of _outlines) {
        const firstPoint = group;
        if (!firstPoint) continue;

        const points = firstPoint.corners;

        pathCommands.push([Command.MOVE, points[0].x, points[1].y]);

        for (const point of points) {
            pathCommands.push([Command.LINE, point.x, point.y]);
        }

        pathCommands.push([Command.CLOSE]);
    }

    const arrowCommands: PathCommand[] = [];
    if(_outlines.length >= 2)
    {
        const from = _outlines[0].center;
        const to = _outlines[1].center;

        const ix = (from.x + to.x) / 2;
        const iy = (from.y + to.y) / 2;
    
        arrowCommands.push([Command.MOVE, from.x, from.y]);
        arrowCommands.push([Command.LINE, ix, iy]);

        for (let i = 1; i < _outlines.length; i++) {
            if (i === _outlines.length - 1) {

                const prev = _outlines[i-1].center;
                const from = new Point((prev.x + _outlines[i].center.x) / 2, (prev.y + _outlines[i].center.y) / 2);
                const to = _outlines[i].center;

                const arrowHeadLength = cellWidth/6;
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const angle = Math.atan2(dy, dx);
        
                const leftX = to.x - arrowHeadLength * Math.cos(angle - Math.PI / 6);
                const leftY = to.y - arrowHeadLength * Math.sin(angle - Math.PI / 6);
        
                const rightX = to.x - arrowHeadLength * Math.cos(angle + Math.PI / 6);
                const rightY = to.y - arrowHeadLength * Math.sin(angle + Math.PI / 6);

                arrowCommands.push([Command.MOVE, from.x, from.y]);
                arrowCommands.push([Command.LINE, to.x, to.y]);
        
                arrowCommands.push([Command.MOVE, to.x, to.y]);
                arrowCommands.push([Command.LINE, leftX, leftY]);
        
                arrowCommands.push([Command.MOVE, to.x, to.y]);
                arrowCommands.push([Command.LINE, rightX, rightY]);
            }
            else {
                const currentCell = _outlines[i];
                const inter = new Point((_outlines[i].center.x + _outlines[i + 1].center.x) / 2, (_outlines[i].center.y + _outlines[i + 1].center.y) / 2);
                arrowCommands.push([Command.CONIC, currentCell.center.x, currentCell.center.y, inter.x, inter.y, 0.9]);
            }
        }        
    }

    const [update] = _interaction;

    update((items: any[]) => {
        const [outline, arrow, label] = items;
        outline.commands = pathCommands;

        const distance = (_outlines.length-1) * cellWidth;

        const moveDistance = `${Math.round(distance / grid.dpi * (grid.gridScale.parsed.multiplier || 0))}${grid.gridScale.parsed.unit || ""}`;

        label.position = {
            x: _outlines[_outlines.length - 1].center.x,
            y: _outlines[_outlines.length - 1].center.y
        };

        label.text.plainText = moveDistance;

        arrow.commands = arrowCommands;
    });
}

/**
 * Converts a given hex color to rgba
 * @param {string} hex - The hex color
 * @param {number} [alpha=1] - The alpha value
 * @returns {string} The rgba representation of the given hex color
 */
function hexToRgba(hex: string, alpha = 1): string {
    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Checks if the pointer is near a character.
 * The pointer is considered near if the distance between the pointer and the character is less than or equal to half the cell width.
 * @param x The x coordinate of the pointer.
 * @param y The y coordinate of the pointer.
 * @returns A promise that resolves to an object { id, center } where id is the id of the character and center is its center point, or null if no character is near the pointer.
 */
async function pointerNearCharacter(x: number, y: number): Promise<{ id: string, center: Point } | null> {
    const point = new Point(x, y);
    const sceneItems = await OBR.scene.items.getItems();

    for (let item of sceneItems) {
        if (item.type === 'IMAGE') {
            const itemPoint = new Point(item.position.x, item.position.y);
            if (itemPoint.distanceTo(point) <= cellWidth / 2) {
                return { id: item.id, center: itemPoint };
            }
        }
    }

    return null;
}

/**
 * Returns true if the pointer is near the last outline, false otherwise.
 * The pointer is considered near if its grid coordinates are within 1 cell of the last outline.
 * @param x The x coordinate of the pointer.
 * @param y The y coordinate of the pointer.
 * @returns A promise that resolves to true if the pointer is near the last outline, false otherwise.
 */
async function isPointerNearLastOutline(x: number, y: number): Promise<boolean> {
    if (_outlines.length === 0) return false;

    const lastOutline = _outlines[_outlines.length - 1];
    const pointerGridCoord = getGridCoordFromPoint(x, y, cellWidth, cellHeight);
    const lastOutlineGridCoord = getGridCoordFromPoint(lastOutline.center.x, lastOutline.center.y, cellWidth, cellHeight);

    const distanceX = Math.abs(pointerGridCoord.x - lastOutlineGridCoord.x);
    const distanceY = Math.abs(pointerGridCoord.y - lastOutlineGridCoord.y);

    return distanceX <= 1 && distanceY <= 1;
}

/**
 * Converts a given point (x, y) to grid coordinates based on the specified cell width and height.
 * 
 * @param x - The x-coordinate of the point.
 * @param y - The y-coordinate of the point.
 * @param cellWidth - The width of a single cell in the grid.
 * @param cellHeight - The height of a single cell in the grid.
 * @returns An object containing the x and y coordinates of the grid cell.
 */

function getGridCoordFromPoint(x: number, y: number, cellWidth: number, cellHeight: number): { x: number; y: number } {
    return {
        x: Math.floor(x / cellWidth),
        y: Math.floor(y / cellHeight),
    };
}


/**
 * Calculate the width and height of a single cell in the grid.
 * @returns {Promise<void>}
 */
export async function calculateCellSize() {
    const centerCell = grid.getCell(grid.snapTo({ x:0, y:0 }, SnapTo.CENTER));
    const corners = centerCell.corners;
    
    cellWidth = Math.hypot(
        corners[1].x - corners[0].x,
        corners[1].y - corners[0].y
    );
    
    cellHeight = Math.hypot(
        corners[3].x - corners[0].x,
        corners[3].y - corners[0].y
    );
}

/**
 * Creates a promise that resolves after the specified number of milliseconds.
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified number of milliseconds.
 */
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Animates the movement of a player from the first outline to the last, moving along the path defined by the outlines.
 * @param id The id of the player to move.
 * @param outlines The array of outlines that define the path that the player should follow.
 * @param stepsPerCell The number of steps to take for each cell in the path.
 * @returns A promise that resolves when the player has finished moving.
 */
async function movePlayer(id: string | null, outlines: Cell[], stepsPerCell = 2) {
    if (!id || outlines.length < 2) return;

    for (let i = 1; i < outlines.length; i++) {
        const from = outlines[i - 1].center;
        const to = outlines[i].center;

        const dx = (to.x - from.x) / stepsPerCell;
        const dy = (to.y - from.y) / stepsPerCell;

        for (let step = 1; step <= stepsPerCell; step++) {
            const newX = from.x + dx * step;
            const newY = from.y + dy * step;

            await OBR.scene.items.updateItems([id], (items) => { 
                items[0].position = { x: newX, y: newY };
                items[0].disableHit = true;
                if(step == stepsPerCell) items[0].disableHit = false;
            });

            await delay(100);
        }
    }
}