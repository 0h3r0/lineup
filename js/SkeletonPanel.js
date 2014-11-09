function createSkeletonPanel(renderer, scale){

   var STANDARD_DIMENSIONS = {width: 170, height:300},
       BLURINESS = 3.9;

   var width = STANDARD_DIMENSIONS.width * scale,
       height = STANDARD_DIMENSIONS.height * scale,
       renderScene,
       renderCamera,
       blurLevel = 1,
       renderComposer,
       mainComposer,
       projectorComposer,
       blurComposer;

    var targetParams = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};
    var renderTarget = new THREE.WebGLRenderTarget(width, height, targetParams);
    var quad = new THREE.Mesh( new THREE.PlaneBufferGeometry(width, height), new THREE.MeshBasicMaterial({map: renderTarget,/*color: 0xff0000,*/ transparent: true, blending: THREE.AdditiveBlending}));

    var Shaders = {
        skeleton: {
            uniforms : {
                currentTime: {type: 'f', value: 100.0},
            },
            vertexShader: [
                '#define INTRODURATION 5.0',
                'varying vec3 vNormal;',
                'uniform float currentTime;',
                'void main() {',
                '  vNormal = normalize( normalMatrix * normal );',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vNormal;',
                'uniform float currentTime;',
                'void main() {',
                '  if(gl_FragCoord.y < currentTime * 150.0){',
                '    float intensity = 1.2 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
                '    vec3 outline = vec3( 0.0708, 0.714, 0.652 ) * pow( intensity, 1.0 );',
                '    gl_FragColor = vec4(outline, intensity);',
                ' } ',
                '}'
            ].join('\n')
        },
        organs: {
            uniforms : {
                currentTime: {type: 'f', value: 100.0},
            },
            vertexShader: [
                '#define INTRODURATION 5.0',
                'varying vec3 vNormal;',
                'uniform float currentTime;',
                'void main() {',
                '  vNormal = normalize( normalMatrix * normal );',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vNormal;',
                'uniform float currentTime;',
                'uniform vec3 vMyColor;',
                'void main() {',
                '  if(gl_FragCoord.y < currentTime * 150.0){',
                '    float intensity = 1.3 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
                '    vec3 outline = vec3( 0.5708, 0.314, 0.252 ) * pow( intensity, 1.0 );',
                '    gl_FragColor = vec4(outline, intensity);',
                ' } ',
                '}'
            ].join('\n')
        }
    };


    function createRenderTarget(width, height){
        var params = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat};
        return new THREE.WebGLRenderTarget(width, height, params);
    }

    function init(){

        renderCamera = new THREE.OrthographicCamera(0, width, height, 0, -1000, 1000),
        renderScene = new THREE.Scene();

        var loader = new THREE.OBJLoader();

        var skeletonMaterial = new THREE.ShaderMaterial({
            uniforms: Shaders.skeleton.uniforms,
            vertexShader: Shaders.skeleton.vertexShader,
            fragmentShader: Shaders.skeleton.fragmentShader,
            shading: THREE.SmoothShading
        });

        var organMaterial = new THREE.ShaderMaterial({
            uniforms: Shaders.organs.uniforms,
            vertexShader: Shaders.organs.vertexShader,
            fragmentShader: Shaders.organs.fragmentShader,
        });

        skeletonMaterial.transparent = true;
        
        organMaterial.transparent = true;

        skeletonMaterial.blending = THREE.AdditiveBlending;
        organMaterial.blending = THREE.AdditiveBlending;

        loader.load( '../models/skeleton.obj', LOADSYNC.register(function ( skeletonObject ) {

            skeletonObject.children[0].geometry.mergeVertices();
            skeletonObject.children[0].geometry.computeVertexNormals();
            skeletonObject.children[0].scale.set(scale,scale,scale);
            skeletonObject.children[1].geometry.computeVertexNormals();
            skeletonObject.children[1].scale.set(scale,scale,scale);

            skeletonObject.children[0].material = skeletonMaterial;
            skeletonObject.children[1].material = organMaterial;

            skeletonObject.position.set(width/2, 15, 0);

            renderScene.add(skeletonObject);

        }));

        renderComposer = new THREE.EffectComposer(renderer, renderTarget);
        renderComposer.addPass(new THREE.RenderPass(renderScene, renderCamera));

        var renderScenePass = new THREE.TexturePass(renderComposer.renderTarget2);

        // projectorComposer = new THREE.EffectComposer(renderer, createRenderTarget(width/1.5, height/1.5));
        // projectorComposer.addPass(renderScenePass);
        // projectorComposer.addPass(new THREE.ProjectorPass(renderer, new THREE.Vector2(-.18, 0)));

        blurComposer = new THREE.EffectComposer(renderer, createRenderTarget(width/4, height/4));
        blurComposer.addPass(renderScenePass);
        blurComposer.addPass(new THREE.ShaderPass(THREE.HorizontalBlurShader, {h: BLURINESS / (width/4)}));
        blurComposer.addPass(new THREE.ShaderPass(THREE.VerticalBlurShader, {v: BLURINESS / (height/4)}));
        blurComposer.addPass(new THREE.ShaderPass(THREE.HorizontalBlurShader, {h: (BLURINESS/4) / (width/4)}));
        blurComposer.addPass(new THREE.ShaderPass(THREE.VerticalBlurShader, {v: (BLURINESS/4) / (height/4)}));
        blurComposer.addPass(new THREE.ShaderPass(THREE.HorizontalBlurShader, {h: (BLURINESS/4) / (width/4)}));
        blurComposer.addPass(new THREE.ShaderPass(THREE.VerticalBlurShader, {v: (BLURINESS/4) / (height/4)}));
        blurComposer.addPass(new THREE.ShaderPass(THREE.VerticalBlurShader, {v: (BLURINESS/4) / (height/4)}));

        mainComposer = new THREE.EffectComposer(renderer, renderTarget);
        mainComposer.addPass(renderScenePass);
        mainComposer.addPass(new THREE.ShaderPass(THREE.FXAAShader, {resolution: new THREE.Vector2(1/width, 1/height)}));

        var addPass = new THREE.ShaderPass(THREE.AdditiveBlendShader);
        addPass.uniforms['tAdd'].value = blurComposer.writeBuffer;
        mainComposer.addPass(addPass);

        var addPass2 = new THREE.ShaderPass(THREE.AdditiveBlendShader);
        addPass2.uniforms['tAdd'].value = blurComposer.writeBuffer;
        mainComposer.addPass(addPass2);

    }

    function render(time){

        if(renderScene.children.length > 0){
            renderScene.children[0].rotation.y = -time/2;
        }
        Shaders.skeleton.uniforms.currentTime.value = time -6;
        Shaders.organs.uniforms.currentTime.value = time -7;
        renderComposer.render();
        blurComposer.render();
        blurComposer.render();
        mainComposer.render();

    }

    function setBlur(blur){
        blurLevel = Math.max(0,Math.min(1,blur));
    }

    function checkBounds(x, y){
        return (x > quad.position.x - width / 2 && x < quad.position.x + width/2) 
               && (y > quad.position.y - height / 2 && y < quad.position.y + height/2);
    }

    function setPosition(x, y, z){
        if(typeof z == "number"){
            z = Math.max(0, Math.min(1, z));
            setBlur(z);
            quad.scale.set(z/2 + .5, z/2 + .5, z/2 + .5);
        }
        quad.position.set(x + width/2, y-height/2, 0);
    }

    init();

    return Object.freeze({
        toString: function(){return "SkeletonPanel";},
        render: render,
        renderTarget: renderTarget,
        width: width,
        height: height,
        quad: quad,
        setBlur: setBlur,
        checkBounds: checkBounds,
        setBlur: function(){ },
        setPosition: setPosition
    });
}
