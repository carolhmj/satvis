import { ArcRotateCamera, AxesViewer, Color3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Tools, Vector3 } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { CreateSceneClass } from "../createScene";
import "@babylonjs/inspector";

import earthDiffuseURL from "../../assets/textures/earthmap1k.jpg";
import earthBumpURL from "../../assets/textures/earthbump1k.jpg";
import earthSpecURL from "../../assets/textures/earthspec1k.jpg";
import Coordinates from "../lib/coordinates";
import SatelliteManager from "./satelliteManager";

class EarthGlobe implements CreateSceneClass {
    createEarthMaterial = () => {
        const material = new StandardMaterial("earth");
        material.diffuseTexture = new Texture(earthDiffuseURL);
        material.bumpTexture = new Texture(earthBumpURL);
        material.specularTexture = new Texture(earthSpecURL);

        return material;
    };

    createScene = async (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> => {
        const scene = new Scene(engine);
        scene.debugLayer.show({embedMode: true});

        //const axes = new AxesViewer(scene, 3);
    
        // Create camera
        const camera = new ArcRotateCamera("camera", 0, 0, 5, new Vector3(0, 0, 0));
        camera.invertRotation = true;
        camera.upperBetaLimit = Tools.ToRadians(360);
        camera.beta = Tools.ToRadians(270);
        camera.attachControl(canvas);

        // Create earth sphere
        const earth = MeshBuilder.CreateSphere("earth", {diameter: 2});
        earth.material = this.createEarthMaterial();

        // Create lights
        const light = new HemisphericLight("light", new Vector3(1,1,0), scene);

        // Create UI 
        const ui = AdvancedDynamicTexture.CreateFullscreenUI("ui");

        // Place test (zero) point
        const pt = MeshBuilder.CreateSphere("t", {diameter: 0.1});
        pt.material = new StandardMaterial("ptm");
        (pt.material as StandardMaterial).diffuseColor = new Color3(1, 0, 0);
        const pos = Coordinates.SphericalToCartesian(1, 0, 1);
        console.log('pos of point 0, 0', pos);
        pt.position = pos;

        const homeLat = -3.742214;
        const homeLon = -38.5375256;
        const pt2 = MeshBuilder.CreateSphere("t2", {diameter: 0.1});
        pt2.material = new StandardMaterial("ptm2");
        (pt2.material as StandardMaterial).diffuseColor = new Color3(1, 1, 0);
        const pos2 = Coordinates.SphericalToCartesian(1, homeLat, homeLon);
        console.log('pos of point fortaleza', pos2);
        pt2.position = pos2;

        const satMan = new SatelliteManager(scene, ui);

        await satMan.initializeSatellites(homeLat, homeLon, 26);

        // Add picking
        /*scene.onPointerPick = (evt, pickInfo) =>{
            if (pickInfo.hit) {
                console.log('point coordinates', pickInfo.pickedPoint);
            }
        }*/ 

        return scene;
    }
}

export default new EarthGlobe();