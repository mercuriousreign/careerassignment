import {
  Suspense,
  useEffect,
  useState,
  useRef,
  type JSXElementConstructor,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
} from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';
import SplitText from './SplitText';
import { Model } from './Model';

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}
import './App.css';
import api from './api';
import React from 'react';
import { Mesh } from 'three';

function TypewriterText({
  text,
  speed = 30,
}: {
  text: string;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i += 1;
      } else {
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <>{displayed}</>;
}

function Box(props: ThreeElements['mesh']) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  useFrame((state, delta) => (meshRef.current.rotation.x += delta));
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : '#2f74c0'} />
    </mesh>
  );
}

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItem = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post<{ result: string }>('/response', {
        response: question,
      });
      setResult(data.result ?? '');
      //setResult((result) => result?.concat(data.result) ?? '');
    } catch (error) {
      console.error("didn't work", error);
      setResult(
        'Request failed. Is the backend running on http://localhost:8000?',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <p>Loading..</p>}
      <form onSubmit={fetchItem}>
        <div className='inputs'>
          <div className='flex'>
            <div className='w-3/4'>
              {result != null && (
                <label className='block my-2 p-2 bg-gray-100 rounded h-32 overflow-y-auto'>
                  <TypewriterText text={result} speed={25} />
                  {/* <SplitText text={result} delay={50} duration={0.6} /> */}
                </label>
              )}
              <textarea
                className='w-full'
                autoFocus
                rows={5}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='Ask your career question…'
              />
            </div>
            <div className='w-1/4'>
              <div id='canvas-container'>
                <Canvas>
                  <Suspense fallback={<Loader />}>
                    {/* <Model></Model> */}
                    <Box></Box>
                    <mesh>
                      <boxGeometry></boxGeometry>
                      <meshStandardMaterial></meshStandardMaterial>
                    </mesh>
                  </Suspense>
                </Canvas>
              </div>
              {/* <input type='submit' value='Submit' /> */}
              <button
                className='w-full'
                type='button'
                onClick={() => fetchItem()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
    // <>
    //   <div>
    //     <a href='https://vite.dev' target='_blank'>
    //       <img src={viteLogo} className='logo' alt='Vite logo' />
    //     </a>
    //     <a href='https://react.dev' target='_blank'>
    //       <img src={reactLogo} className='logo react' alt='React logo' />
    //     </a>
    //   </div>
    //   <h1>Vite + React</h1>
    //   <div className='card'>
    //     <div className='inputs'>
    //       <textarea></textarea>
    //     </div>
    //     <button onClick={() => setCount((count) => count + 1)}>
    //       count is {count}
    //     </button>
    //     <p>
    //       Edit <code>src/App.tsx</code> and save to test HMR
    //     </p>
    //   </div>
    //   <p className='read-the-docs'>
    //     Click on the Vite and React logos to learn more
    //   </p>
    // </>
  );
}

export default App;
