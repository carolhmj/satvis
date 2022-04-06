import { Scene, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Ellipse, Line, Rectangle, TextBlock } from "@babylonjs/gui";

import Coordinates from "../lib/coordinates";
import * as Secrets from "../secrets.json";

export default class SatelliteManager {
    private _satelliteList = [];
    private _scene;
    private _uiTexture;

    constructor(scene: Scene, uiTexture: AdvancedDynamicTexture) {
        this._scene = scene;
        this._uiTexture = uiTexture;
    }

    async initializeSatellites(latitude: number, longitude: number, category: number) {
        // Do the query for satellites
        const satellitesResponse = await fetch(`/rest/v1/satellite/above/${latitude}/${longitude}/0/70/${category}&apiKey=${Secrets.apiKey}`);
        const satellitesJson = await satellitesResponse.json();
        console.log('satellites json', satellitesJson);
        const satList = satellitesJson.above;

        for (const sat of satList) {
            const pt = MeshBuilder.CreateSphere(sat.satname, {diameter: 0.1}, this._scene);
            pt.material = new StandardMaterial(sat.satname, this._scene);
            (pt.material as StandardMaterial).diffuseColor = Color3.Random();
            const pos = Coordinates.SphericalToCartesian(Math.log10(Math.log10(sat.satalt)) + 1, sat.satlat, sat.satlng);
            pt.position = pos;

            const line = new Line();
            line.lineWidth = 4;
            this._uiTexture.addControl(line);
            line.linkWithMesh(pt);
            
            const rect = new Rectangle();
            //rect.adaptWidthToChildren = true;
            rect.width = '100px';
            rect.height = '40px';
            //rect.adaptHeightToChildren = true;
            rect.background = 'grey';
            rect.color = 'black';
            this._uiTexture.addControl(rect);
            rect.linkWithMesh(pt);
            rect.linkOffsetY = '-40px';
            
            const label = new TextBlock();
            label.fontSizeInPixels = 10;
            label.text = `${sat.satname} 
            (${sat.launchDate})`;
            
            rect.addControl(label);
            
            line.connectedControl = rect;
            
            const target = new Ellipse();
            target.widthInPixels = 10;
            target.heightInPixels = 10;

            this._uiTexture.addControl(target);
            target.linkWithMesh(pt);
             
        }
    }
}