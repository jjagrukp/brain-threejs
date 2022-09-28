
import * as THREE from 'three';

// Remove this if you don't need to load any 3D model
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { GUI } from 'dat.gui';

import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';

import Stats from 'stats.js';

import { gsap } from 'gsap'
import { ScrollTrigger } from "gsap/ScrollTrigger"


class Brain {
    constructor(container) {
        this.config = {
            "meshSize" : 0.0050,
            //"particleCount": 7500,
            "particleCount": 6556,
            "sections" : {
                "firstSection": ".first-section",
                "secondSection": ".second-section",
                "thirdSection": ".third-section",
                "fourthSection": ".fourth-section"
            }
        }

        this.container = document.querySelector(container)

        this.hover = false
        this.ballLoaded = false
        this.thumbsupLoaded = false

        this.activeModel = this.brain

        this.scrollPercent = 0
        this.uRotationY = 0

        this.morphed = false
        this.spaceParticlesPositions = []
        this.explosionGeometryLoaded = false
        this.explosionArray = []

        this.brainGeometry = []
        this.ballGeometry = []
        this.thumbsUpGeometry = []

        this.morphToThumbsUp = false

        this.colors = [
            new THREE.Color(0x6B00F5),
            new THREE.Color(0xF53A00),
            new THREE.Color(0xB400F5),
            new THREE.Color(0x0041F5),
        ]

        this.uniforms = {
            uHover: 0
        }

        this._resizeCb = () => this._onResize()
        this._mousemoveCb = e => this._onMousemove(e)
    }

    init() {
        //Register Scroll Trigger
        gsap.registerPlugin(ScrollTrigger)

        this._createLoader()
        this._checkMobile()
        this._createScene()
        this._createCamera()
        this._createRenderer()
        this._createRaycaster()
        this._createParticles()

        this._loadThumbsUp().then(() => {
            // console.log("thumbs up loaded")
        })

        // this.gltfLoader.load('/themes/custom/brain/models/brain-instance.glb', obj => {
        //     this.brainInstance = obj.scene.children[0]

        //     //console.log(this.brainInstance)
        //     const light = new THREE.PointLight( 0xff0000, 100, 100 );
        //     light.position.set( 5, 5, 5 );
        //     this.scene.add( light );

        //     this.scene.add(this.brainInstance)
            
        //     console.log(this.brainInstance.parent.children[1].material)

        //     // this.brainInstance.material.transparent = true
        //     // this.brainInstance.material.transparent = true
        //     //this.brainInstance.material.opacity = 0.5
    
        //     this.brainInstance.material.needsUpdate = true


        // })
    
        
        this._loadBrainModel().then(() => {
            this._gsapScrollAnimate()
            this._addListeners()

            let t = new THREE.Clock();

            this.renderer.setAnimationLoop(() => {
                // //Work on the rotate when hover
                // for(let i = 0; i<this.particleInstance.count; i++) {
                //     this.particleInstance.setUniformAt("uRotation", i, t.getElapsedTime())
                // } 

                this._update()
        
                this._render()
            })
        })

    }

    _createLoader() {
        this.loadingManager = new THREE.LoadingManager()

        this.loadingManager.onLoad = () => {
            document.documentElement.classList.add('model-loaded')
        }

        this.gltfLoader = new GLTFLoader(this.loadingManager)
    }

    _checkMobile() {
        this.isMobile = window.innerWidth < 767
    }

    _createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5b400);
    }

    _createCamera() {
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
        this.camera.position.set(0, 0, 0)
    }

    _createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: window.devicePixelRatio === 1
        })

        this.container.appendChild(this.renderer.domElement)

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
        this.renderer.physicallyCorrectLights = true
    }
    
    _createRaycaster() {
        this.mouse = new THREE.Vector2()
        this.raycaster = new THREE.Raycaster()
        this.intersects = []
        this.point = new THREE.Vector3()
    }

    _addListeners() {
        window.addEventListener('resize', this._resizeCb, { passive: true })
        window.addEventListener('mousemove', this._mousemoveCb, { passive: true })
    }

    _removeListeners() {
        window.removeEventListener('resize', this._resizeCb, { passive: true })
        window.removeEventListener('mousemove', this._mousemoveCb, { passive: true })
    }

    _render() {
        this.renderer.render(this.scene, this.camera)
    }
    
    _update() {
        this.camera.lookAt(0, 0, 0)
        this.camera.position.z = this.isMobile ? 2.3 : 1.2

        // this.particleInstance.material.uniforms.uRotation.value += 0.000001

        // console.log( this.particleInstance.material)
        // this.particleInstance.material.uniforms.uRotation.needsUpdate = true

        // this.particleInstance.material.uniformsNeedUpdate = true
        // this.particleInstance.material.needsUpdate = true
    }

    _onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        this._checkMobile()
    }

    _checkMobile() {
        this.isMobile = window.innerWidth < 767
    }

    _onMousemove(e) {
        const x = (e.clientX / this.container.offsetWidth) * 2 - 1
        const y = -(e.clientY / this.container.offsetHeight) * 2 + 1

        this.mouse.set(x, y)

        gsap.to(this.camera.position, {
            x: () => x*0.15,
            y: () => y*0.1,
            duration: 0.5
        })

        this.raycaster.setFromCamera(this.mouse, this.camera)
        //Additional check to see if activeModel is loaded yet
        if(this.activeModel) {
            this.intersects = this.raycaster.intersectObject(this.activeModel)
        }else{
            this.intersects = []
        }

        if (this.intersects.length === 0) { // Mouseleave

        if (this.hover) {
            this.hover = false
            this._animateHoverUniform(0)
        }
        } else { 
            //Check this code here
            if (!this.hover) {
                this.hover = true
                this._animateHoverUniform(1)
            }

            //Convert the world coordinates to local
            this.activeModel.worldToLocal(this.intersects[0].point)
            
            gsap.to(this.point, {
                x: () => this.intersects[0]?.point.x || 0,
                y: () => this.intersects[0]?.point.y || 0,
                z: () => this.intersects[0]?.point.z || 0,
                overwrite: true,
                duration:0.5,
                onUpdate: () => {
                    //Brain
                    for (let i = 0; i < this.activeModel.geometry.attributes.position.array.length / 3; i++) {
                        this.particleInstance.setUniformAt('uPointer', i, this.point)
                        this.uRotationY = 1
                    }
                }
            })
        }
    }

    _animateHoverUniform(value) { 
        gsap.to(this.uniforms, {
            uHover: value,
            duration: 0.5,
            onUpdate: () => {
                //Brain
                for (let i = 0; i < this.activeModel.geometry.attributes.position.length / 3; i++) {
                    this.particleInstance.setUniformAt('uHover', i, this.uniforms.uHover)
                }
            }
        })
    }

    _createParticles() {

        this.gltfLoader.load('./pyramid.glb', pyramid => {
            this.pyramid = pyramid.scene.children[0]
            this.pyramid.scale.set(0.007,0.007,0.007)

            this.pyramid.updateMatrix()
            this.pyramid.geometry.applyMatrix4(this.pyramid.matrix)

            const particleGeometry = this.pyramid.geometry;

            // const material = new THREE.MeshBasicMaterial();

            const material = new THREE.ShaderMaterial({
                vertexShader: 
                `uniform vec3 uPointer;
                uniform vec3 uColor;
                uniform float uRotation;
                uniform float uSize;
                uniform float uHover;
                uniform float uOpacity;
                uniform vec3 cameraPos;

                varying vec4 vColor;
                varying vec2 vUv;

                #define PI 3.14159265359

                mat2 rotate(float angle) {
                    float s = sin(angle);
                    float c = cos(angle);

                    return mat2(c, -s, s, c);
                }
                
                void main() {
                    vUv = uv;
                // First, calculate mvPosition to get the distance between the instance and the
                // projected point uPointer.
                vec4 mvPosition = vec4(position, 1.0);
                mvPosition = instanceMatrix * mvPosition;

                // Distance between the point projected from the mouse and each instance
                float d = distance(uPointer, mvPosition.xyz);

                // Define the color depending on the above value
                float c = smoothstep(0.25, 0.1, d);

                float scale = uSize + c*6.*uHover;

                vec3 pos = position;
                pos *= scale;
                pos.xz *= rotate(PI*c*uRotation + PI*uRotation*0.43);
                pos.xy *= rotate(PI*c*uRotation + PI*uRotation*0.71);

                // Re-define mvPosition with the scaled and rotated position.
                mvPosition = instanceMatrix * vec4(pos, 1.0);

                gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

                if(mvPosition.z < 0. && mvPosition.x < 0.6 && mvPosition.y < 0.6 && mvPosition.x > -0.6 && mvPosition.y > -0.2) {
                    vColor = vec4(0.,0.,0.,0.2);
                } else {
                    vColor = vec4(uColor,uOpacity);
                }

                vColor = vec4(uColor, uOpacity);
                }`,
                fragmentShader: 
                `varying vec4 vColor;
                varying vec2 vUv;
                uniform sampler2D texture;

                void main() {
                    //vec4 tt = texture2D(texture,vUv);
                    gl_FragColor = vColor;
                //gl_fragColor = tt;
                }`,
                uniforms: {
                    uPointer: { value: new THREE.Vector3() },
                    uColor: { value: new THREE.Color() },
                    uRotation: { value: 0 },
                    uSize: { value: 0 },
                    uHover: { value: this.uniforms.uHover },
                    uOpacity: {value: 1},
                    texture: {value: new THREE.TextureLoader().load("./brain-texture.png")},
                    cameraPos: {value: new THREE.Vector3()}
                }
            })

            //Creating the particleInstance as much as the largest length of vertices of the models
            this.particleInstance = new InstancedUniformsMesh(particleGeometry, material, this.config.particleCount)

            const vertices = [];

            for ( let i = 0; i < this.config.particleCount; i ++ ) {

                const x = THREE.MathUtils.randFloatSpread( 4 );
                const y = THREE.MathUtils.randFloatSpread( 4 );
                const z = THREE.MathUtils.randFloatSpread( 4 );

                vertices.push( x, y, z );
            }

            this.spaceParticlesPositions = [...vertices];
            this.spaceParticlesMatrix = this.particleInstance.instanceMatrix.clone();

            const dummy = new THREE.Object3D()

            for (let i = 0; i < vertices.length; i += 3) {
                dummy.position.set(
                    vertices[i + 0],
                    vertices[i + 1],
                    vertices[i + 2]
                )

                dummy.updateMatrix()

                this.particleInstance.setMatrixAt(i / 3, dummy.matrix)

                this.particleInstance.setUniformAt('uRotation', i / 3, THREE.MathUtils.randFloat(-1, 1))

                this.particleInstance.setUniformAt('uSize', i / 3, THREE.MathUtils.randFloat(0.3, 3))

                const colorIndex = THREE.MathUtils.randInt(0, this.colors.length - 1)
                this.particleInstance.setUniformAt('uColor', i / 3, this.colors[colorIndex])

                this.particleInstance.setUniformAt('uOpacity', i / 3, 1)
            }

            console.log(this.particleInstance);

            this.scene.add(this.particleInstance)
        })
    }
    
    _loadBrainModel() {
        return new Promise(resolve => {
            this.gltfLoader.load('./brain.glb', gltf => {
                this.brain = gltf.scene.children[0]

                this.scene.add(this.brain)
                this.brain.scale.set(0.85,0.85,0.85)
                
                this.brain.material.dispose();
                this.brain.material = new THREE.MeshBasicMaterial({
                    color: 0xf5b400
                })
                this.brain.material.needsUpdate = true;
                this.brain.material.transparent = true;
                this.brain.material.opacity = 0.8;
                this.brain.material.side = THREE.BackSide;

                this.brainPosition = this.brain.geometry.attributes.position.clone();

                this.brainGeometry = new Float32Array(this.brain.geometry.attributes.position.array)

                resolve()
            })
        })
    }

    _loadThumbsUp() {
        return new Promise(resolve => {
          this.gltfLoader.load('./thumbs-up.glb', obj => {
    
            this.thumbsup = obj.scene.children[0]

            this.thumbsup.material.wireframe = true
            this.thumbsup.material.transparent = true
            this.thumbsup.material.opacity = 0.2
    
            this.thumbsup.material.needsUpdate = true
            this.thumbsup.scale.set(2,2,2)
            this.thumbsup.position.set(0.75,-0.25,0)

            this.thumbsup.updateMatrix()
            this.thumbsup.geometry.applyMatrix4(this.thumbsup.matrix)
    
            // this.thumbsup.updateMatrix()
    
            this.thumbsup.position.set(0,0,0)
            this.thumbsup.scale.set(1,1,1)
            this.thumbsup.updateMatrix()
        
            this.scene.add(this.thumbsup)
            this.thumbsup.visible = false

            this.thumbsUpGeometry = this.thumbsup.geometry.attributes.position.array
            
            resolve()
          })
    
        })
      }

    _gsapScrollAnimate() {
        //Animate to brain from the particles
        const startAnimation = () => {
            this.particleInstance.count = this.brainGeometry.length / 3;

            this.particleInstance.traverse

            for (let i = 0; i <= this.brainGeometry.length; i += 3) {
                //Set new position to particleInstance using GSAP
                const matrix = new THREE.Matrix4()
                let position = new THREE.Vector3()
    
                this.particleInstance.getMatrixAt(i / 3, matrix)
                position.setFromMatrixPosition(matrix)
    
                position.x *= 40
                position.y *= 40
                position.z *= 40
    
                gsap.to(position,
                {
                    x: this.brainGeometry[i + 0], 
                    y: this.brainGeometry[i + 1], 
                    z: this.brainGeometry[i + 2],
                    duration: 3,
                    ease: "slow(1.7, 0.7, false)",
                    onUpdate: () => {
                        matrix.setPosition(position)
    
                        this.particleInstance.setMatrixAt(i / 3, matrix)
                    
                        this.particleInstance.instanceMatrix.needsUpdate = true
                    },
                    onComplete: () => {
                        if(i == this.brainGeometry.length) {
                            this.activeModel = this.brain
                        }
                    }
                    
                })
            }

            const light = new THREE.PointLight( 0xff0000, 10, 100 );
            light.position.set( 5, 5, 5 );
            this.scene.add( light );

            console.log(this.brain)


            //Change Brain and particle position to the right
            //TODO: Try setting the position via camera
            this.brain.position.x = 1
            this.brain.position.z = -0.9

            this.particleInstance.position.x = 1
            this.particleInstance.position.z = -0.9
        }

        //Rotate Animation
        const rotateAnimation = () => {
            let rotateAndPositionBrainTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: this.config.sections.firstSection,
                    start: "top top",
                    scrub: 1,
                    toggleActions: "play pause reverse reset",
                    endTrigger: this.config.sections.secondSection,
                    end: "center center"
                }
            })
          
            rotateAndPositionBrainTimeline.add('start').to(this.brain.rotation, {
                y: 2,
                duration: 20,
                overwrite: true,
                onUpdate: () => {
                    this.particleInstance.rotation.y = this.brain.rotation.y 
                }
            }, 'start').to(this.brain.position, {
                x: -0.9,
                z: -0.4,
                duration: 10,
                overwrite: true,
                onUpdate: () => {
                    this.particleInstance.position.x = this.brain.position.x
                    this.particleInstance.position.z = this.brain.position.z
                }
            }, 'start')
        }

        //Brain back to centre Animation
        const brainBacktoNormal = () => {
            
            let brainBacktoNormalTimeline = gsap.timeline({
                scrollTrigger: {
                trigger: this.config.sections.secondSection,
                start: "center center-=50px",
                scrub: true,
                toggleActions: "play pause reverse reset",
                end: "+=200px",
                onEnterBack: () => {
                    this.activeModel = this.brain
                
                    // if(this.morphed) {
                    //     this.particleInstance.count = this.brainGeometry.length / 3
                
                    //     for(let i=0; i < this.brainGeometry.length; i += 3) {
                    //         const matrix = new THREE.Matrix4()
                    //         const position = new THREE.Vector3()
                    
                    //         this.particleInstance.getMatrixAt(i / 3, matrix)
                    //         position.setFromMatrixPosition(matrix)
                
                    //         position.x = this.brainGeometry[i]
                    //         position.y = this.brainGeometry[i + 1]
                    //         position.z = this.brainGeometry[i + 2]
                
                    //         matrix.setPosition(position)
                    //         this.particleInstance.setMatrixAt(i / 3, matrix)
                    //         this.particleInstance.instanceMatrix.needsUpdate = true
                    //     }
                
                    //     this.morphed = false
                    // }
                }
                }
            })
            
            brainBacktoNormalTimeline.add('start').to(this.brain.rotation, {
                y: 0,
                duration: 1,
                overwrite: true,
                onUpdate: () => {
                    console.log(this.particleInstance)
                    this.particleInstance.rotation.y = this.brain.rotation.y 
                }
            }, 'start').to(this.brain.position, {
                x: 0,
                z: 0,
                duration: 1, 
                overwrite: true,
                onUpdate: () => {
                    this.particleInstance.position.x = this.brain.position.x
                    this.particleInstance.position.z = this.brain.position.z
                }
            }, 'start')
        }

        //Exploding the brain
        const explodeBrain = () => {
            //Explode Brain
            let brainExplode = gsap.timeline({
                scrollTrigger: {
                    trigger: this.config.sections.thirdSection,
                    start: "center center",
                    scrub: 1,
                    toggleActions: "play pause reverse reset",
                    endTrigger: this.config.sections.fourthSection,
                    markers: true,
                }
            });

            brainExplode.add("start");

            for(let i = 0; i < this.spaceParticlesPositions.length; i += 3) {
                
                const position = new THREE.Vector3(
                    this.brainPosition.array[i],
                    this.brainPosition.array[i + 1],
                    this.brainPosition.array[i + 2]
                )

                brainExplode.to(position, {
                    x: this.spaceParticlesPositions[i],
                    y: this.spaceParticlesPositions[i + 1],
                    z: this.spaceParticlesPositions[i + 2] + 1,
                    overwrite: true,
                    duration: 1,
                    onUpdate: () => {
                        const matrix = new THREE.Matrix4()
            
                        this.particleInstance.getMatrixAt(i / 3, matrix)
                        //position.setFromMatrixPosition(matrix)

                        matrix.setPosition(position);

                        this.particleInstance.setMatrixAt(i / 3 , matrix);
                        this.particleInstance.instanceMatrix.needsUpdate = true;
                    }
                },"start")
            }
        }

        //Morph the brain to Thumbsup
        const morphBrainToThumbsUp = () => {
                        
            let morphBrainToThumbsUpAnimation = gsap.timeline({
                scrollTrigger: {
                    trigger: this.config.sections.thirdSection,
                    start: "+=200px",
                    scrub: true,
                    toggleActions: "play pause reverse reset",
                    endTrigger: this.config.sections.fourthSection,
                    end: "center center",
                    onEnterBack: () => {
                        this.activeModel = this.brain
                        this.particleInstance.count = this.brainGeometry.length / 3
                    },
                    onEnter: () => {
                        morphBrainToThumbsUpAnimation.add("start")
        
                        this.particleInstance.count = this.thumbsUpGeometry.length / 3;
                        this.particleInstance.rotation.set(0,0,0)

                        for(let i = 0; i < this.thumbsUpGeometry.length ; i += 3) {
                            const position = new THREE.Vector3()
                            const matrix = new THREE.Matrix4()
                        
                            this.particleInstance.getMatrixAt(i / 3, matrix)
                            position.setFromMatrixPosition(matrix)
                
                            const tweenPoint = gsap.to(position, {
                                x: this.thumbsUpGeometry[i],
                                y: this.thumbsUpGeometry[i + 1],
                                z: this.thumbsUpGeometry[i + 2],
                                overwrite: true,
                                duration: 5,
                                onUpdate: () => {
                                    matrix.setPosition(position)
                                    this.particleInstance.setMatrixAt(i / 3 , matrix)
                                    this.particleInstance.instanceMatrix.needsUpdate = true
                                }
                        
                            })
                            
                            morphBrainToThumbsUpAnimation.add(tweenPoint, "start")
                        }
                    }
                }   
            })
        }
        
        startAnimation()
        rotateAnimation()
        brainBacktoNormal()
        explodeBrain()
        // morphBrainToThumbsUp()
    }
}


const app = new Brain('#app');
app.init();
               