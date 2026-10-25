import { Component, Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = import.meta.env.VITE_POD_MODEL_URL
const shellColor=new THREE.Color('#d9dee5'),blueprintColor=new THREE.Color('#244b6d')
const views = { shell:[0,2.1,8.6], canopy:[0,1.7,5.2], levitation:[-.3,-.2,5.4], propulsion:[3.1,.6,5.4], control:[-1.7,.5,5.4] }
const anchors = { shell:[1.4,.3,.45], canopy:[-.05,.87,0], levitation:[-.25,-.38,.48], propulsion:[2.62,.08,.12], control:[-1.4,.32,-.38] }
function hullGeometry(){
 const pts=[[-3.05,.02,.02],[-2.82,.27,.3],[-2.3,.47,.48],[-1.55,.57,.56],[0,.62,.6],[1.55,.56,.53],[2.35,.42,.42],[2.85,.2,.24],[3.02,.015,.02]],v=[],ix=[],s=72
 pts.forEach(([x,ry,rz],i)=>{for(let j=0;j<=s;j++){const a=j/s*Math.PI*2;v.push(x,Math.cos(a)*ry,Math.sin(a)*rz);if(i<pts.length-1&&j<s){const n=i*(s+1)+j;ix.push(n,n+1,n+s+1,n+1,n+s+2,n+s+1)}}})
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g
}
function ProceduralPod({progress,activePart}){
 const [hull]=useState(()=>hullGeometry()),[edges]=useState(()=>new THREE.EdgesGeometry(hull,28)),wire=useRef(),canopy=useRef(),shell=useRef()
 useFrame(()=>{const p=progress?.current?.v??0;if(wire.current)wire.current.material.opacity=Math.max(0,(p-.48)*1.9);if(shell.current){const b=THREE.MathUtils.smoothstep(p,.53,.98);shell.current.material.opacity=1-b*.58;shell.current.material.color.lerpColors(shellColor,blueprintColor,b)}if(canopy.current)canopy.current.material.emissiveIntensity=activePart==='canopy'?.38:.04})
 return <>
  <mesh geometry={hull} castShadow><meshPhysicalMaterial ref={shell} color="#d9dee5" metalness={.78} roughness={.24} clearcoat={.8} clearcoatRoughness={.18} transparent opacity={1}/></mesh>
  <lineSegments ref={wire} geometry={edges}><lineBasicMaterial color="#46aaff" transparent opacity={0} depthWrite={false}/></lineSegments>
  <mesh ref={canopy} position={[-.05,.49,0]} scale={[2.25,.5,.76]} castShadow><sphereGeometry args={[1,48,24]}/><meshPhysicalMaterial color="#07121f" metalness={.64} roughness={.14} clearcoat={1} clearcoatRoughness={.05} emissive="#096ec1" emissiveIntensity={.04}/></mesh>
  <mesh position={[0,-.29,0]} scale={[2.15,.11,.72]}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#101c2b" metalness={.72} roughness={.32}/></mesh>
  {[-1.85,-1.25,-.55,.55,1.25,1.85].map(x=><mesh key={x} position={[x,-.18,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.2,.025,8,36]}/><meshStandardMaterial color="#168bff" emissive="#006bff" emissiveIntensity={activePart==='levitation'?2.2:.45}/></mesh>)}
  <mesh position={[2.55,.03,0]} scale={[.3,.18,.45]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#b8c7dd" metalness={.8} roughness={.2}/></mesh>
 </>
}
class ModelBoundary extends Component{constructor(p){super(p);this.state={failed:false}}static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?this.props.fallback:this.props.children}}
function LoadedPod(){const gltf=useLoader(GLTFLoader,MODEL_URL);return <primitive object={gltf.scene} scale={1.2}/>}
function ProjectedCallout({rig,activePart,elements}){
 const {camera,size}=useThree(),point=useMemo(()=>new THREE.Vector3(),[])
 useFrame(()=>{
  const refs=elements?.current,anchor=anchors[activePart]
  if(!refs||!anchor||!refs.path||!refs.marker||!refs.label||!rig.current)return
  rig.current.updateWorldMatrix(true,false)
  point.set(...anchor).applyMatrix4(rig.current.matrixWorld).project(camera)
  const visible=point.z>-1&&point.z<1&&Math.abs(point.x)<1.15&&Math.abs(point.y)<1.15
  // eslint-disable-next-line react/immutability -- intentional frame-synced projection through ref-bound nodes
  refs.label.style.visibility=visible?'visible':'hidden'
  if(!visible)return
  const x=(point.x*.5+.5)*size.width,y=(-point.y*.5+.5)*size.height,flip=x>size.width*.67
  const labelX=flip?x-205:x+28,labelY=y-21,elbow=flip?x-15:x+15
  // eslint-disable-next-line react/immutability -- SVG path follows the projected model anchor
  refs.path.setAttribute('d',`M ${x/size.width*1000} ${y/size.height*600} L ${elbow/size.width*1000} ${y/size.height*600} L ${labelX/size.width*1000} ${(labelY+10)/size.height*600}`)
  // eslint-disable-next-line react/immutability -- SVG endpoint follows the projected model anchor
  refs.marker.setAttribute('cx',x/size.width*1000);refs.marker.setAttribute('cy',y/size.height*600)
  // eslint-disable-next-line react/immutability -- update position directly to avoid per-frame React renders
  refs.label.style.transform=`translate3d(${labelX}px,${labelY}px,0)`
 })
 return null
}function PodGroup({progress,activePart,interactive,annotationElements}){
 const rig=useRef(),drag=useRef({down:false,x:0,y:0,offsetY:0,offsetZ:0,yaw:0,pitch:0}),cameraTarget=useMemo(()=>new THREE.Vector3(),[])
 useFrame(({camera},dt)=>{
  const p=progress?.current?.v??0,d=drag.current
  const yaw=p<.42?THREE.MathUtils.lerp(-.42,.38,p/.42):p<.7?THREE.MathUtils.lerp(.38,1.05,(p-.42)/.28):THREE.MathUtils.lerp(1.05,.1,(p-.7)/.3)
  const lift=p>.67&&p<.9?Math.sin((p-.67)/.23*Math.PI)*.62:0
  if(rig.current){rig.current.rotation.y=THREE.MathUtils.damp(rig.current.rotation.y,d.down?d.yaw:yaw+d.offsetY,3,dt);rig.current.rotation.z=THREE.MathUtils.damp(rig.current.rotation.z,d.down?d.pitch:d.offsetZ,3,dt);rig.current.position.y=THREE.MathUtils.damp(rig.current.position.y,lift,3,dt);rig.current.position.x=THREE.MathUtils.damp(rig.current.position.x,p>.72?-.5+((p-.72)/.28)*1.6:0,2,dt);const sc=p>.2&&p<.43?1.22:p>.43&&p<.7?.88:1;rig.current.scale.setScalar(THREE.MathUtils.damp(rig.current.scale.x,sc,2,dt))}
  const view=activePart?views[activePart]:p<.4?[0,2.1,8.6]:p<.7?[0,1.15,6.2]:p<.9?[2,.6,7.2]:[0,2.3,10]
  cameraTarget.set(...view);camera.position.lerp(cameraTarget,1-Math.exp(-dt*1.7));camera.lookAt(0,p>.65?.35:0,0)
 })
 const onDown=e=>{if(!interactive)return;e.stopPropagation();e.target.setPointerCapture?.(e.pointerId);drag.current={...drag.current,down:true,x:e.clientX,y:e.clientY,yaw:rig.current.rotation.y,pitch:rig.current.rotation.z}}
 const onMove=e=>{const d=drag.current;if(!interactive||!d.down)return;d.yaw+=(e.clientX-d.x)*.008;d.pitch+=(e.clientY-d.y)*.004;d.x=e.clientX;d.y=e.clientY;d.offsetY=d.yaw-(progress?.current?.v<.42?THREE.MathUtils.lerp(-.42,.38,(progress?.current?.v??0)/.42):0)}
 return <><group ref={rig} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={()=>drag.current.down=false} onPointerLeave={()=>drag.current.down=false}>
  {MODEL_URL?<ModelBoundary fallback={<ProceduralPod progress={progress} activePart={activePart}/>}><Suspense fallback={<ProceduralPod progress={progress} activePart={activePart}/>}><LoadedPod/></Suspense></ModelBoundary>:<ProceduralPod progress={progress} activePart={activePart}/>}
 </group><ProjectedCallout rig={rig} activePart={activePart} elements={annotationElements}/></>
}
function SceneLights({progress}){const blue=useRef(),key=useRef();useFrame(()=>{const p=progress?.current?.v??0;if(blue.current)blue.current.intensity=18+52*Math.max(0,p-.55);if(key.current)key.current.intensity=62+18*Math.sin(Math.min(1,p)*Math.PI)});return <><ambientLight intensity={.52}/><hemisphereLight intensity={.72} color="#d9e9ff" groundColor="#07182b"/><spotLight ref={key} position={[-4,7,5]} angle={.42} penumbra={.8} intensity={62} color="#cfddf0"/><pointLight ref={blue} position={[3,2,-4]} intensity={18} color="#008cff"/><pointLight position={[-2,-1,3]} intensity={17} color="#477dff"/></>}export default function PodScene({progress,activePart,interactive=true,className='',annotationElements}){
 return <Canvas className={className} fallback={<div className="pod-fallback"><span>MV—01 / 3D VIEW UNAVAILABLE</span></div>} dpr={[1,1.4]} camera={{position:[0,2.1,8.6],fov:36}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}>
  <color attach="background" args={['#050912']}/><fog attach="fog" args={['#050912',10,27]}/>
  <SceneLights progress={progress}/>
  <PodGroup progress={progress} activePart={activePart} interactive={interactive} annotationElements={annotationElements}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.1,0]}><planeGeometry args={[80,80]}/><meshStandardMaterial color="#07121d" metalness={.72} roughness={.28}/></mesh><gridHelper args={[28,36,'#133e63','#10253a']} position={[0,-1.09,0]}/>
 </Canvas>
}












