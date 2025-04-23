import OBR from '@owlbear-rodeo/sdk';
import { getId } from '@/utils/getId';

let lastSelection: string | null = null;

export default function createZoomTool() {

    OBR.player.onChange(async (player) => {
        if (player.selection && player.selection.length > 0) {
            lastSelection = player.selection[0];
        }
    });

    OBR.tool.create({
        id: getId("zoom-modal"),
        icons: [
            {
                icon: '/zoom-icon.svg',
                label: 'Zoom Image',
            },
        ],
        shortcut: 'Shift+Z',
        onClick: async () => {
            if (!lastSelection) return false;

            const items = await OBR.scene.items.getItems([lastSelection]) as any;
            if (!items || items.length === 0 || items[0].type !== 'IMAGE') {
                console.warn('Item inválido o no encontrado:', lastSelection);
                return false;
            }

            const imageUrl = items[0].image?.url;
            if (!imageUrl) return false;
            await OBR.modal.open({
                id: getId("zoom-modal"),
                url: `/modal.html?image=${encodeURIComponent(imageUrl)}`,
                width: 400,
                height: 500,
                hidePaper: true,
            });
            await OBR.player.deselect();

            return true;
        }
    });
}