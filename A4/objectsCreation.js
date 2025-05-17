import { dominoColors, dominoMaterials } from "./config.js";

export function createGround(scene, world, w, d) {
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.2,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    const body = new CANNON.Body({ mass: 0 });
    body.addShape(new CANNON.Plane());
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(body);
}

export function createDominoUTurn(scene, world, dominoBodies, dominoMeshes, state) {
    const positions = [];
    const spacing = 0.9;
    const segmentLen = 10;
    const arcCount = 25;
    const radius = spacing * (segmentLen - 1);

    for (let i = 0; i < segmentLen - 1; i++) {
        positions.push(new THREE.Vector3(15, 0.5, -i * spacing));
    }

    const c1 = new THREE.Vector3(-radius, 0, -radius);
    for (let j = 0; j < arcCount; j++) {
        const t = -Math.PI * (j / (arcCount - 1));
        positions.push(
            new THREE.Vector3(
                15 + c1.x + radius * Math.cos(t),
                0.5,
                c1.z + radius * Math.sin(t)
            )
        );
    }

    let end = positions[positions.length - 1];
    for (let i = 1; i < segmentLen; i++) {
        positions.push(new THREE.Vector3(end.x, 0.5, end.z + i * spacing));
    }

    end = positions[positions.length - 1];
    for (let i = 1; i < segmentLen; i++) {
        positions.push(new THREE.Vector3(end.x, 0.5, end.z + i * spacing));
    }

    const forkPoint = positions[positions.length - 1].clone();

    const splitRadius = radius - 0.8;
    const splitCount = arcCount - 3;
    const splitAngle = Math.PI / 2;

    const leftBranchPositions = [];
    for (let j = 0; j < splitCount; j++) {
        const t = splitAngle * (j / (splitCount - 1));
        leftBranchPositions.push(
            new THREE.Vector3(
                forkPoint.x - splitRadius + splitRadius * Math.cos(t),
                0.5,
                forkPoint.z - 0.4 + splitRadius * Math.sin(t)
            )
        );
    }
    positions.push(...leftBranchPositions);

    const rightStartPosIndex = positions.length;

    for (let j = 0; j < splitCount; j++) {
        const t = Math.PI - splitAngle * (j / (splitCount - 1));
        positions.push(
            new THREE.Vector3(
                forkPoint.x + splitRadius + splitRadius * Math.cos(t),
                0.5,
                forkPoint.z + 0.4 + splitRadius * Math.sin(t)
            )
        );
    }

    const postSplitStartIndex = positions.length;

    const last = leftBranchPositions[leftBranchPositions.length - 1];
    const secondLast = leftBranchPositions[leftBranchPositions.length - 2];
    const dx = last.x - secondLast.x;
    const dz = last.z - secondLast.z;

    let growSpacing = 1.0;
    let lastGrowX = last.x;
    const growCount = 15;
    let lastGrowZ = last.z;

    for (let i = 1; i <= growCount; i++) {
        growSpacing *= 1.08;
        lastGrowX += dx * growSpacing;
        lastGrowZ += dz * growSpacing;

        positions.push(new THREE.Vector3(lastGrowX, 0.5, lastGrowZ));
    }

    positions.forEach((pos, idx) => {
        if (pos.distanceTo(forkPoint) < 1e-4) return;

        let width = 0.6,
            height = 1,
            depth = 0.1,
            mass = 1.5;

        if (idx >= postSplitStartIndex) {
            const scaleFactor = 1 + (idx - postSplitStartIndex) * 0.1;
            width *= scaleFactor;
            height *= scaleFactor;
            depth *= scaleFactor;
            mass *= scaleFactor;
        }

        const geo = new THREE.BoxGeometry(width, height, depth);
        // const mat = new THREE.MeshPhongMaterial({ color: dominoColors.initial });
        const mat = dominoMaterials[idx % dominoMaterials.length];
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.position.y = height / 2;

        let ang;

        if (idx === segmentLen - 1 + arcCount + (segmentLen - 1) + (segmentLen - 1) + leftBranchPositions.length - 1) {
            const prev = positions[idx - 1];
            ang = Math.atan2(pos.x - prev.x, pos.z - prev.z);
        }
        else if (pos.distanceTo(forkPoint) < 1e-2) {
            const prev = positions[idx - 1];
            ang = Math.atan2(pos.x - prev.x, pos.z - prev.z);
        } else {
            const next = positions[idx + 1] || positions[idx - 1];
            ang = Math.atan2(next.x - pos.x, next.z - pos.z);
        }

        mesh.rotation.y = ang;

        scene.add(mesh);
        dominoMeshes.push(mesh);
        const meshIndex = dominoMeshes.length - 1;
        if (meshIndex < rightStartPosIndex) {
            state.leftBranch.add(mesh);
        } else if (meshIndex < postSplitStartIndex) {
            state.rightBranch.add(mesh);
        } else {
            state.leftBranch.add(mesh);
        }

        const shape = new CANNON.Box(
            new CANNON.Vec3(width / 2, height / 2, depth / 2)
        );
        const body = new CANNON.Body({
            mass,
            position: new CANNON.Vec3(pos.x, mesh.position.y, pos.z),
            shape,
            material: new CANNON.Material({ friction: 0.1, restitution: 0.1 }),
            linearDamping: 0.1,
            angularDamping: 0.1,
        });
        body.quaternion.setFromEuler(0, ang, 0);
        world.addBody(body);
        dominoBodies.push(body);
    });
}

export function createSeesaw(scene, world, state) {
    const plankExitZ = -1.9;
    const seesawY = 4.3;
    const length = 10.5;
    const width = 1;
    const thickness = 0.05;

    const tiltY = THREE.MathUtils.degToRad(90);

    const geo = new THREE.BoxGeometry(length, thickness, width);
    const mat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(15, seesawY, plankExitZ - 1);

    mesh.rotation.y = tiltY;

    scene.add(mesh);

    const shape = new CANNON.Box(
        new CANNON.Vec3(length / 2, thickness / 2, width / 2)
    );
    const body = new CANNON.Body({
        mass: 2,
        material: new CANNON.Material({ friction: 0.3 }),
    });
    body.addShape(shape);

    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);

    world.addBody(body);

    const pivotBody = new CANNON.Body({ mass: 0 });
    pivotBody.addShape(new CANNON.Sphere(0.1)); // tiny shape
    pivotBody.position.copy(body.position);
    pivotBody.quaternion.copy(body.quaternion);
    world.addBody(pivotBody);

    const localAxis = new CANNON.Vec3(1, 0, 0);

    const q = body.quaternion;
    const worldAxis = new CANNON.Vec3();
    q.vmult(localAxis, worldAxis);

    const hinge = new CANNON.HingeConstraint(body, pivotBody, {
        pivotA: new CANNON.Vec3(0, 0, 0),
        axisA: worldAxis,
        pivotB: new CANNON.Vec3(0, 0, 0),
        axisB: worldAxis,
    });
    world.addConstraint(hinge);

    // store for syncing in updatePhysics()
    state.seesaw = { mesh, body };
}

export function createPlank(scene, world) {
    const length = 10;
    const width = 2;
    const thickness = 0.2;
    const y = 15;
    const tilt = Math.PI / 12;

    const geo = new THREE.BoxGeometry(width, thickness, length);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(15, y, length / 2 + 25);
    mesh.receiveShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, thickness / 2, length / 2)
    );
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    world.addBody(body);
}

export function createPlank1(scene, world, dominoBodies, dominoMeshes) {
    const length = 11.5;
    const width = 2;
    const thickness = 0.2;
    const y = 8;
    const tilt = 0;

    const geo = new THREE.BoxGeometry(width, thickness, length);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(15, y, length / 2 + 2);

    mesh.receiveShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, thickness / 2, length / 2)
    );
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    world.addBody(body);

    const dominoHeight = 1.5;
    const spacing = 0.8;
    const halfLen = length / 2;
    const startZ = mesh.position.z + halfLen - spacing;
    const endZ = mesh.position.z - halfLen + spacing;
    const n = Math.floor((startZ - endZ) / spacing) + 1;

    for (let i = 0; i < n + 1; i++) {
        const z = startZ - i * spacing;
        const pos = new THREE.Vector3(15, y + dominoHeight / 2 + thickness / 2, z);

        const dGeo = new THREE.BoxGeometry(0.6, dominoHeight, 0.1);
        const dMat = dominoMaterials[i % dominoMaterials.length].clone();
        const dMesh = new THREE.Mesh(dGeo, dMat);
        dMesh.position.copy(pos);
        dMesh.rotation.y = Math.PI;
        scene.add(dMesh);
        dominoMeshes.push(dMesh);

        const dShape = new CANNON.Box(new CANNON.Vec3(0.3, dominoHeight / 2, 0.05));
        const dBody = new CANNON.Body({
            mass: 15,
            position: new CANNON.Vec3(pos.x, pos.y, pos.z),
            shape: dShape,
            material: new CANNON.Material({ friction: 0.1, restitution: 0.1 }),
            linearDamping: 0.1,
            angularDamping: 0.1,
        });
        dBody.quaternion.setFromEuler(0, Math.PI, 0);
        world.addBody(dBody);
        dominoBodies.push(dBody);
    }
}

export function createPlank2(scene, world, dominoBodies, dominoMeshes) {
    const length = 10;
    const width = 2;
    const thickness = 0.2;
    const y = 11;
    const tilt = Math.PI;

    const geo = new THREE.BoxGeometry(width, thickness, length);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(15, y, length / 2 + 14.2);
    mesh.rotation.x = -tilt;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, thickness / 2, length / 2)
    );
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(mesh.position);
    body.quaternion.setFromEuler(-tilt, 0, 0);
    world.addBody(body);

    const radius = 0.5;
    const height = 1;
    const ballY = y + radius + 0.1;
    const ballZ = mesh.position.z - length / 2 + 1.5;

    const cGeo = new THREE.CylinderGeometry(radius, radius, height, 32);
    const cMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.rotation.z = Math.PI / 2;
    cMesh.position.set(15, ballY - 10, ballZ);
    cMesh.castShadow = true;
    scene.add(cMesh);

    const cShape = new CANNON.Cylinder(radius, radius, height, 32);
    const cBody = new CANNON.Body({
        mass: 2.8,
        position: new CANNON.Vec3(15, ballY, ballZ),
        shape: cShape,
        material: new CANNON.Material({ friction: 0.2, restitution: 0.1 }),
        linearDamping: 0.01,
        angularDamping: 0.01,
    });

    const quat = new CANNON.Quaternion();
    quat.setFromEuler(0, 0, Math.PI / 2);
    cBody.quaternion.copy(quat);

    world.addBody(cBody);

    dominoMeshes.push(cMesh);
    dominoBodies.push(cBody);
}

export function createBallTrigger(scene, world) {
    const radius = 0.5;
    const plankTopY = 15 + 0.2 / 2 + radius;
    const startZ = 70 / 2 - 1 - radius;

    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshPhongMaterial({ color: 0xff5500, shininess: 50 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, plankTopY, startZ);
    mesh.castShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({
        mass: 3,
        position: new CANNON.Vec3(15, plankTopY, startZ),
        shape: new CANNON.Sphere(radius),
        material: new CANNON.Material({ friction: 0.3, restitution: 0.5 }),
        linearDamping: 0.37,
        angularDamping: 0.5,
    });
    world.addBody(body);

    // ball = { mesh, body };
    return { mesh, body };
}
