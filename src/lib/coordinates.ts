import { Tools, Vector3 } from "@babylonjs/core";

export default class Coordinates {
    public static SphericalToCartesian(radius: number, theta: number, phi: number) : Vector3 {
        const rtheta = Tools.ToRadians(theta);
        const rphi = Tools.ToRadians(phi);

        const z = radius * Math.cos(rtheta) * Math.sin(rphi);
        const y = -radius * Math.sin(rtheta) * Math.cos(rphi);
        const x = -radius * Math.cos(rphi);

        return new Vector3(x, y, z);
    }
}