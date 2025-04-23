import { createCanvas } from "canvas"; 

/**
 * Generates a canvas avatar image, given a name and optional size.
 *
 * The avatar is a rectangle with a gradient that goes from one random color to another.
 * The text is white and uses the Arial font. The text is the concatenation of the first two
 * letters of each word in the name, in uppercase.
 *
 * @param {string} name - The name to generate an avatar for.
 * @param {number} [size=100] - The size of the avatar in pixels.
 * @returns {string} A data URI that can be used as the src attribute of an image.
 */
export function generateAvatar(name: string, size: number = 100) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    canvas.width = size;
    canvas.height = size;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, getRandomColor());
    gradient.addColorStop(1, getRandomColor());

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.font = `${size / 2}px Arial`;
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const initials = name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    ctx.fillText(initials, size / 2, size / 2);

    return canvas.toDataURL();
}

/**
 * Generates a random hex color.
 *
 * @returns A random hex color as a string in the format `#XXXXXX`.
 */
function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}