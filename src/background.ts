import { grid } from '@davidsev/owlbear-utils';
import OBR from '@owlbear-rodeo/sdk';

import { MovementTool, calculateCellSize } from '@/tools/MovementTool';
import ZoomTool from '@/tools/ZoomTool';

OBR.onReady(async () => {
    await grid.awaitReady();
    await calculateCellSize();

    OBR.scene.grid.onChange(async () => {
        await calculateCellSize();
    })

    MovementTool();
    ZoomTool();
});