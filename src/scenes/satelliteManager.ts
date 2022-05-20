import { Scene, MeshBuilder, StandardMaterial, Color3, Mesh, Animation, Node } from "@babylonjs/core";
import { AdvancedDynamicTexture, Ellipse, Line, Rectangle, TextBlock } from "@babylonjs/gui";

import Coordinates from "../lib/coordinates";
import Secrets from "../secrets.json";

const ANIMATION_SPEED = 20;
const ANIMATION_FPS = 60;
export default class SatelliteManager {
    private _satelliteList: Array<Mesh> = [];
    private _scene;
    private _uiTexture;
    private _obsLat = 0;
    private _obsLng = 0;
    private _sceneRoot;

    constructor(scene: Scene, uiTexture: AdvancedDynamicTexture, sceneRoot: Node) {
        this._scene = scene;
        this._uiTexture = uiTexture;
        this._sceneRoot = sceneRoot;
    }

    private _makeUILabel(sat: Record<string, unknown>, pt: Mesh) {
        const line = new Line();
            line.lineWidth = 4;
            this._uiTexture.addControl(line);
            line.linkWithMesh(pt);
            
            const rect = new Rectangle();
            rect.width = '100px';
            rect.height = '40px';
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

    async buildAllSatellitesAnimations() {
        for (const satMesh of this._satelliteList) {
            const satMeta = satMesh.metadata;
            this.buildSatelliteAnimation(satMeta, satMesh).then(() => {
                console.log('build sat animation for', satMeta.satname);
            });
        }
    }

    async buildSatelliteAnimation(sat: Record<string, unknown>, pt: Mesh) {
        // Fetch the next 5 minutes of satellite positions
        const lookTime = 300;
        const satRes = await fetch(`/rest/v1/satellite/positions/${sat.satid}/${this._obsLat}/${this._obsLng}/0/${lookTime}&apiKey=${Secrets.apiKey}`);
        const satPos = await satRes.json();
        console.log('satellite pos response', satPos);
        // Return an array with 1 entry per second
        const posKeys = [];
        let i = 0;
        for (; i < satPos.positions.length; i++) {
            const satInstant = satPos.positions[i];
            posKeys.push({
                frame: i * ANIMATION_FPS / ANIMATION_SPEED,
                value: this._getWorldCoordinates(satInstant.satlatitude, satInstant.satlongitude, sat.satalt as number)
            });
        }

        const anim = new Animation(sat.satname as string, "position", ANIMATION_FPS, Animation.ANIMATIONTYPE_VECTOR3);
        anim.setKeys(posKeys);

        pt.animations = [anim];

        //this._scene.beginDirectAnimation(pt, [anim], 0, i * ANIMATION_FPS, true);
    }

    private _getWorldCoordinates(latitude: number, longitude: number, altitude: number) {
        return Coordinates.SphericalToCartesian(Math.log10(Math.log10(altitude)) + 1, latitude, longitude);
    }

    async initializeSatellites(latitude: number, longitude: number, category: number) {
        console.log('start initialize satellite');
        this._obsLat = latitude;
        this._obsLng = longitude;

        // Do the query for satellites
        const satellitesResponse = await fetch(`/rest/v1/satellite/above/${latitude}/${longitude}/0/70/${category}&apiKey=${Secrets.apiKey}`);
        const satellitesJson = await satellitesResponse.json();
        console.log('satellites json', satellitesJson);
        const satList = satellitesJson.above;
        console.log('satList', satList);
        for (const sat of satList) {
            const pt = MeshBuilder.CreateSphere(sat.satname, {diameter: 0.1}, this._scene);
            pt.material = new StandardMaterial(sat.satname, this._scene);
            (pt.material as StandardMaterial).diffuseColor = Color3.Random();
            const pos = this._getWorldCoordinates(sat.satlat, sat.satlng, sat.satalt);
            pt.position = pos;
            pt.parent = this._sceneRoot;

            this._makeUILabel(sat, pt);

            // Save satellite information as metadata so we can update it
            pt.metadata = sat;

            this._satelliteList.push(pt);
        }
        console.log('finish initialize sat');
    }
}