import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLoaders, usePhysics, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localObject = new THREE.Object3D;

export default () => {
  const app = useApp();
  const physics = usePhysics();

  let path1 = null;
  let path2 = null;
  let trafficPath = null;
  let pathArray = [];
  let pathArray2 = [];

  let availablePaths = [];

  let car1 = null;
  let car2 = null;
  let car3 = null;
  let currentPathPoint = 0;

  const citySpeedLimit = 0.1;

  let trafficAmount = 5;

  let variants = 5;

  let carDistance = 3;

  let initialized = false;


  let activeCarsArray = [];

  app.name = 'city';

  const _updateTraffic = (path) => {

    
  };

  const _shuffleArray = (a) => {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
  }

  useFrame(() => {

    if(!initialized && activeCarsArray.length === (trafficAmount * variants) && availablePaths.length === 2) {
      for (var i = 0; i < activeCarsArray.length; i++) {
        activeCarsArray[i].activePath = availablePaths.indexOf(availablePaths[Math.floor(Math.random() * availablePaths.length)]);
        let spawnPoint = Math.floor(Math.random() * (availablePaths[activeCarsArray[i].activePath].length - 0 + 1)) + 0;
        activeCarsArray[i].currentPathPoint = spawnPoint;


        activeCarsArray[i].position.copy(availablePaths[activeCarsArray[i].activePath][spawnPoint]); // I know this looks fucking retarded, one sec
        activeCarsArray[i].updateMatrixWorld();
        activeCarsArray[i].collider.position.copy(activeCarsArray[i].position);
        activeCarsArray[i].collider.quaternion.copy(activeCarsArray[i].quaternion);
        activeCarsArray[i].collider.updateMatrixWorld();
        physics.setTransform(activeCarsArray[i].collider);
        activeCarsArray = _shuffleArray(activeCarsArray);
      }
      initialized = true;
    }


    if(initialized) {
      for (var i = 0; i < activeCarsArray.length; i++) {
        let activeCar = activeCarsArray[i];
        if(activeCar.currentPathPoint < availablePaths[activeCar.activePath].length) {

          var dir = new THREE.Vector3();
          let activePathPoint = availablePaths[activeCar.activePath][activeCar.currentPathPoint];

          dir.subVectors(activePathPoint, activeCarsArray[i].position);
          localObject.position.copy(activeCar.position);
          localObject.lookAt(activePathPoint);

          activeCar.quaternion.slerp(localObject.quaternion, 0.1);

          activeCarsArray[i].position.add(dir.multiplyScalar(activeCar.speed));

          let distance = activeCar.position.distanceTo(activePathPoint);


          for (var x = 0; x < activeCarsArray.length; x++) {
            let otherCar = activeCarsArray[x];

            if(otherCar.activePath === activeCar.activePath && otherCar.currentPathPoint > activeCar.currentPathPoint) {
              let distanceToFrontCar = activeCar.position.distanceTo(otherCar.position);

              if(distanceToFrontCar < 7) {
                if(activeCar.speed > 0) {
                activeCar.speed -= 0.01;
                }
                if(activeCar.speed < 0) {
                  activeCar.speed = 0;
                }
              }
              else {
                if(activeCar.speed < (citySpeedLimit)) {
                  activeCar.speed += 0.001;
                }
               }
            }

          }

          if(distance < 1) {
            activeCar.currentPathPoint+=1;
          }

          if(activeCar.rear_wheels && activeCar.front_wheels) {
            activeCar.rear_wheels.rotateX(activeCar.speed);
            activeCar.front_wheels.rotateX(activeCar.speed);
          }

          if(activeCar.currentPathPoint < 20) {
            activeCar.visible = false;
          }
          else {
              activeCar.visible = true;
          }
          activeCar.updateMatrixWorld();
        }
        else {
         activeCar.currentPathPoint = 0;
         activeCar.position.copy(availablePaths[activeCar.activePath][0]);
       }
        activeCarsArray[i].collider.position.copy(activeCarsArray[i].position);
        activeCarsArray[i].collider.quaternion.copy(activeCarsArray[i].quaternion);
        activeCarsArray[i].collider.updateMatrixWorld();
        physics.setTransform(activeCarsArray[i].collider);
        app.updateMatrixWorld();
      }
    }
  });

  let physicsIds = [];
  (async () => {
    const u = `${baseUrl}assets/ground.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    o = o.scene;
    app.add(o);
    
    const physicsId = physics.addGeometry(o);
    physicsIds.push(physicsId);
  })();
  (async () => {
    const u = `${baseUrl}assets/city.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    o = o.scene;
    app.add(o);
    o.updateMatrixWorld();
  })();
  (async () => {
    const u = `${baseUrl}assets/path1.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    path1 = o.scene;
    app.add(path1);
    path1.updateMatrixWorld();
    path1.visible = false;

    // Building path
    let positions = path1.children[0].geometry.attributes["position"].array;
    let ptCout = positions.length / 3;
    for (let i = 0; i < ptCout; i++) { 
      let p = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      path1.children[0].localToWorld( p );
      pathArray.push(p);
    }
    availablePaths.push(pathArray);

  })();
  (async () => {
    const u = `${baseUrl}assets/path2.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    path2 = o.scene;
    app.add(path2);
    path2.updateMatrixWorld();

    path2.visible = false;

    // Building path
    let positions = path2.children[0].geometry.attributes["position"].array;
    let ptCout = positions.length / 3;
    for (let i = 0; i < ptCout; i++) { 
      let p = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      path2.children[0].localToWorld( p );
      pathArray2.push(p);
    }
    availablePaths.push(pathArray2);

  })();
  (async () => {
    const u = `${baseUrl}assets/car1.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    for (var i = 0; i < trafficAmount; i++) {
      let car = o.scene.clone();
      app.add(car);
      car.updateMatrixWorld();
      car.speed = citySpeedLimit;
      car.preferedDistance = Math.floor(Math.random() * (17 - 11 + 1)) + 11;
      car.variableSpeed = Math.random() * (0.02 - -0.01) + -0.01;;
      car.currentPathPoint = 0;
      car.activePath = 0;
      activeCarsArray.push(car);

      const physicsId = physics.addGeometry(car);
      physicsIds.push(physicsId);

      car.collider = physicsId;

      car.traverse(o => {
      if(o.name === "front_wheels") {
        car.front_wheels = o;
      }
      if(o.name === "rear_wheels") {
        car.rear_wheels = o;
      }
    });
    }
  })();
  (async () => {
    const u = `${baseUrl}assets/car2.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    for (var i = 0; i < trafficAmount; i++) {
      let car = o.scene.clone();
      app.add(car);
      car.updateMatrixWorld();
      car.speed = citySpeedLimit;
      car.preferedDistance = Math.floor(Math.random() * (17 - 11 + 1)) + 11;
      car.variableSpeed = Math.random() * (0.02 - -0.01) + -0.01;;
      car.currentPathPoint = 0;
      car.activePath = 0;
      activeCarsArray.push(car);

      const physicsId = physics.addGeometry(car);
      physicsIds.push(physicsId);

      car.collider = physicsId;

      car.traverse(o => {
      if(o.name === "front_wheels") {
        car.front_wheels = o;
      }
      if(o.name === "rear_wheels") {
        car.rear_wheels = o;
      }
    });
    }
  })();
  (async () => {
    const u = `${baseUrl}assets/car3.glb`; // green truck
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    for (var i = 0; i < trafficAmount; i++) {
      let car = o.scene.clone();
      app.add(car);
      car.updateMatrixWorld();
      car.speed = citySpeedLimit;
      car.preferedDistance = Math.floor(Math.random() * (17 - 11 + 1)) + 11;
      car.variableSpeed = Math.random() * (0.02 - -0.01) + -0.01;;
      car.currentPathPoint = 0;
      car.activePath = 0;
      activeCarsArray.push(car);

      const physicsId = physics.addGeometry(car);
      physicsIds.push(physicsId);

      car.collider = physicsId;

      car.traverse(o => {
      if(o.name === "front_wheels") {
        car.front_wheels = o;
      }
      if(o.name === "rear_wheels") {
        car.rear_wheels = o;
      }
    });
    }
  })();
  (async () => {
    const u = `${baseUrl}assets/car4.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    for (var i = 0; i < trafficAmount; i++) {
      let car = o.scene.clone();
      app.add(car);
      car.updateMatrixWorld();
      car.speed = citySpeedLimit;
      car.preferedDistance = Math.floor(Math.random() * (17 - 11 + 1)) + 11;
      car.variableSpeed = Math.random() * (0.02 - -0.01) + -0.01;;
      car.currentPathPoint = 0;
      car.activePath = 0;
      activeCarsArray.push(car);

      const physicsId = physics.addGeometry(car);
      physicsIds.push(physicsId);

      car.collider = physicsId;

      car.traverse(o => {
      if(o.name === "front_wheels") {
        car.front_wheels = o;
      }
      if(o.name === "rear_wheels") {
        car.rear_wheels = o;
      }
    });
    }
  })();
  (async () => {
    const u = `${baseUrl}assets/car5.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    for (var i = 0; i < trafficAmount; i++) {
      let car = o.scene.clone();
      app.add(car);
      car.updateMatrixWorld();
      car.speed = citySpeedLimit;
      car.preferedDistance = Math.floor(Math.random() * (17 - 11 + 1)) + 11;
      car.variableSpeed = Math.random() * (0.02 - -0.01) + -0.01;;
      car.currentPathPoint = 0;
      car.activePath = 0;
      activeCarsArray.push(car);

      const physicsId = physics.addGeometry(car);
      physicsIds.push(physicsId);

      car.collider = physicsId;

      car.traverse(o => {
      if(o.name === "front_wheels") {
        car.front_wheels = o;
      }
      if(o.name === "rear_wheels") {
        car.rear_wheels = o;
      }
    });
    }
  })();
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
