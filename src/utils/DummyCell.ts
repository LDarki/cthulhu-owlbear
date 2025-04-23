import { Cell, Point, LineSegment } from '@davidsev/owlbear-utils';

import { Vector2 } from '@owlbear-rodeo/sdk';

export class DummyCell extends Cell {
    private readonly _center: Point;
    private readonly _size: number;

    constructor(center: Point, size: number) {
        super();
        this._center = center;
        this._size = size;
    }

    get center(): Point {
        return this._center;
    }

    get corners(): Point[] {
        const half = this._size / 2;
        return [
            new Point({ x: this._center.x - half, y: this._center.y - half }),
            new Point({ x: this._center.x + half, y: this._center.y - half }),
            new Point({ x: this._center.x + half, y: this._center.y + half }),
            new Point({ x: this._center.x - half, y: this._center.y + half }),
        ];
    }

    get edges(): LineSegment[] {
        const c = this.corners;
        return [
            new LineSegment(c[0], c[1]),
            new LineSegment(c[1], c[2]),
            new LineSegment(c[2], c[3]),
            new LineSegment(c[3], c[0]),
        ];
    }

    containsPoint(point: Vector2): boolean {
        const half = this._size / 2;
        return (
            point.x >= this._center.x - half &&
            point.x <= this._center.x + half &&
            point.y >= this._center.y - half &&
            point.y <= this._center.y + half
        );
    }

    nearestPointOnEdge(point: Vector2): Point {
        const half = this._size / 2;
        const x = Math.max(this._center.x - half, Math.min(point.x, this._center.x + half));
        const y = Math.max(this._center.y - half, Math.min(point.y, this._center.y + half));
        return new Point({ x, y });
    }

    toString(): string {
        return `[${this._center.x}, ${this._center.y}]`;
    }

    neighbors(_: boolean): Cell[] {
        return [];
    }
}
