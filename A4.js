// Last time the scene was rendered.
var lastRenderTime = 0;
// Currently active VRDisplay.
var vrDisplay;
// How big of a box to render.
var boxSize = 10;
// Various global THREE.Objects.
var scene;
var cube;
var controls;
var effect;
var camera;
var spheres = [];
var enimies = [];
var sphere;
var direction = null;
// EnterVRButton for rendering enter/exit UI.
var vrButton;
var borgCubeMaterial;




function onLoad() {
    // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
    // Only enable it if you actually need to.
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);

    // Append the canvas element created by the renderer to document body element.
    document.body.appendChild(renderer.domElement);

    // Create a three.js scene.
    scene = new THREE.Scene();

    // Create a three.js camera.
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);

    controls = new THREE.VRControls(camera);
    controls.standing = true;
    camera.position.y = controls.userHeight;

    // Apply VR stereo rendering to renderer.
    effect = new THREE.VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    // // Add a repeating grid as a skybox.
    var loader = new THREE.TextureLoader();
    loader.load('img/box.png', onTextureLoaded);

    // Create Sky Box
    var skyboxCubemap = new THREE.CubeTextureLoader()
    .setPath( 'img/cubemap/' )
    .load( [
    'cube1.png', 'cube2.png',
    'cube3.png', 'cube4.png',
    'cube5.png', 'cube6.png'
    ] );

    // Create Sky Box
    var borgCubemap = new THREE.CubeTextureLoader()
    .setPath( 'img/borgCubeMap/' )
    .load( [
    'borg.png', 'borg.png',
    'borg.png', 'borg.png',
    'borg.png', 'borg.png'
    ] );

    var skyboxMaterial = new THREE.ShaderMaterial({
            uniforms: {
            skybox: { type: "t", value: skyboxCubemap },
        },
        side: THREE.DoubleSide
    });


    borgCubeMaterial = new THREE.ShaderMaterial({
        uniforms: {
        skybox: { type: "t", value: borgCubemap },
    },
    side: THREE.DoubleSide
});

    // -------------------------------
    // LOADING SHADERS
    var shaderFiles = [
      'glsl/skybox.vs.glsl',
      'glsl/skybox.fs.glsl'
    ];
    
    new THREE.SourceLoader().load(shaderFiles, function(shaders) {
        skyboxMaterial.vertexShader = shaders['glsl/skybox.vs.glsl']	
        skyboxMaterial.fragmentShader = shaders['glsl/skybox.fs.glsl']
        borgCubeMaterial.vertexShader = shaders['glsl/skybox.vs.glsl']	
        borgCubeMaterial.fragmentShader = shaders['glsl/skybox.fs.glsl']
    })


    // // Add skybox
    var skyboxGeometry = new THREE.CubeGeometry( boxSize, boxSize, boxSize);
    var skyBox = new THREE.Mesh( skyboxGeometry, skyboxMaterial );
    skyBox.rotation.set(0,-1.57,0);
    scene.add(skyBox);

    // Create 3D objects.
    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);

    // Position cube mesh to be right in front of you.
    cube.position.set(0, controls.userHeight, -1);

    // Add cube mesh to your three.js scene
    //scene.add(cube);

    var lookAtVector = new THREE.Vector3(0, 0, -20);
    lookAtVector.applyQuaternion(camera.quaternion).add( camera.position );

        // Create 3D objects.
    var geometry = new THREE.CylinderGeometry(0.1, 0.1, 5);
    var material = new THREE.MeshNormalMaterial();
    cylinder = new THREE.Mesh(geometry, material);


    window.addEventListener('resize', onResize, true);
    window.addEventListener('vrdisplaypresentchange', onResize, true);

    window.addEventListener( 'click', onClick);

    // Initialize the WebVR UI.
    var uiOptions = {
        color: 'black',
        background: 'white',
        corners: 'square'
    };
    vrButton = new webvrui.EnterVRButton(renderer.domElement, uiOptions);
    vrButton.on('exit', function() {
        camera.quaternion.set(0, 0, 0, 1);
        camera.position.set(0, controls.userHeight, 0);
    });
    vrButton.on('hide', function() {
        document.getElementById('ui').style.display = 'none';
    });
    vrButton.on('show', function() {
        document.getElementById('ui').style.display = 'inherit';
    });
    document.getElementById('vr-button').appendChild(vrButton.domElement);
    document.getElementById('magic-window').addEventListener('click', function() {
        vrButton.requestEnterFullscreen();
    });
    }

function onTextureLoaded(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(boxSize, boxSize);

    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    var material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x01BE00,
        side: THREE.BackSide
    });

    // Align the skybox to the floor (which is at y=0).
    skybox = new THREE.Mesh(geometry, material);
    skybox.position.y = boxSize/2;
    //scene.add(skybox);

    // For high end VR devices like Vive and Oculus, take into account the stage
    // parameters provided.
    setupStage();
}


function onClick (event) {
    //scene.remove(sphere);
    
    var lookAtVector = new THREE.Vector3(0, 0, -20);
    lookAtVector.applyQuaternion(camera.quaternion);

    direction = lookAtVector;
   
    var geometry = new THREE.SphereGeometry(0.1, 0.1, 5);
    var material = new THREE.MeshBasicMaterial( { color: 0xFF0000, transparent: false} );
    
    sphere = new THREE.Mesh(geometry, material);

    // // Position cube mesh to be right in front of you.
    sphere.position.set( 0, controls.userHeight, 0);
    
    var count =0;

    spheres.push([sphere, lookAtVector, count])

    scene.add(sphere);

    createEnemy();
}


var enemyTimer = 0;

// Request animation frame loop function
function animate(timestamp) {
    var delta = Math.min(timestamp - lastRenderTime, 500);
    lastRenderTime = timestamp;

    updateWepons();

    updateEnimies(delta);
    
    // Only update controls if we're presenting.
    if (vrButton.isPresenting()) {
        controls.update();
    }
    // Render the scene.
    effect.render(scene, camera);

    vrDisplay.requestAnimationFrame(animate);
}


function updateWepons(){
    var removeCount = 0;
    
    for (let i=0; i < spheres.length; i++){
        // update how long the sphere has exisited
        spheres[i][2] = spheres[i][2]+1;

        // remove sphere if it has been around for too long
        if(spheres[i][2]>200){
            scene.remove(spheres[i][0]);
            removeCount++;
        }

        // Move sphere away from viewer
        spheres[i][0].translateOnAxis(spheres[i][1], 0.001);
    }

    // Remove old spheres
    spheres.splice(0, removeCount);
    
}

function updateEnimies(delta){
    var removeCount = 0;
    
    for (let i=0; i < enimies.length; i++){
        // update how long the sphere has exisited
        enimies[i][2] = enimies[i][2]+1;

        // remove sphere if it has been around for too long
        // if(enimies[i][2]>200){
        //     scene.remove(enimies[i][0]);
        //     removeCount++;
        // }

        var enemy = enimies[i][0];
        for (let i=0; i < spheres.length; i++){
            
            var sphere = spheres[i][0];
            
            
            var offset = new THREE.Vector3(0,controls.userHeight,0);
            if(sphere.position.distanceTo( offset.add(enemy.position)) < .5){
                scene.remove(enemy);
                scene.remove(sphere);
            }
        }


        // Apply rotation to cube mesh
        enimies[i][0].rotation.y += delta * 0.0006;

        // Move sphere away from viewer
        //enimies[i][0].translateOnAxis(enimies[i][1], 0.00001);
    }

    // Remove old spheres
    enimies.splice(0, removeCount);
}

function createEnemy(){

    // Create New Random Position
    var angle = Math.random()*2*Math.PI;


    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, borgCubeMaterial);


    // // Position cube mesh to be right in front of you.
    cube.position.set(3*Math.sin(angle), controls.userHeight+2*Math.random()-1, 3*Math.cos(angle));
    
    var count =0;

    var attackDirection = -1*(cube.position - camera.position);

    enimies.push([cube, attackDirection, count])

    scene.add(cube);
}

function onResize(e) {
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage() {
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
      if (vrDisplay.stageParameters) {
        setStageDimensions(vrDisplay.stageParameters);
      }
      vrDisplay.requestAnimationFrame(animate);
    }
  });
}

function setStageDimensions(stage) {
  // Make the skybox fit the stage.
  var material = skybox.material;
  scene.remove(skybox);

  // Size the skybox according to the size of the actual stage.
  var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
  skybox = new THREE.Mesh(geometry, material);

  // Place it on the floor.
  skybox.position.y = boxSize/2;
  scene.add(skybox);

  // Place the cube in the middle of the scene, at user height.
  cube.position.set(0, controls.userHeight, 0);
}

window.addEventListener('load', onLoad);