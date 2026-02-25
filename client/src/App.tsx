import { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}
import './App.css';
import api from './api';
import React from 'react';

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

function OrbitingSphere({
  radius,
  speed,
  tilt,
  color,
}: {
  radius: number;
  speed: number;
  tilt: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    meshRef.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t) * Math.sin(tilt) * radius,
      Math.sin(t) * Math.cos(tilt) * radius,
    );
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        toneMapped={false}
      />
    </mesh>
  );
}

function Box({
  speed = 2,
  ...props
}: ThreeElements['mesh'] & { speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  useFrame((_state, delta) => {
    meshRef.current.rotation.x += delta * speed;
    meshRef.current.rotation.y += delta * speed;
  });
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
      <meshStandardMaterial
        color={hovered ? '#ff2020' : '#2060ff'}
        emissive={hovered ? '#ff2020' : '#2060ff'}
        emissiveIntensity={hovered ? 3 : 1.5}
        wireframe={true}
        toneMapped={false}
      />
    </mesh>
  );
}

type Message = { role: 'human' | 'ai'; text: string };

function App() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchItem = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setLoading(true);
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'human', text: trimmed }]);
    try {
      const { data } = await api.post<{ result: string }>('/response', {
        response: trimmed,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: data.result ?? '' },
      ]);
    } catch (error) {
      console.error("didn't work", error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Request failed. Is the backend running on http://localhost:8000?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/history');
    } catch {
      // best-effort
    }
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      fetchItem();
    }
  };

  return (
    <div className='h-screen flex flex-col items-center pb-8 pt-4 overflow-hidden'>
      <form
        onSubmit={fetchItem}
        className='w-full flex-1 flex flex-col min-h-0'
      >
        <div className='inputs w-full px-80 flex-1 flex flex-col min-h-0 '>
          <div className='flex flex-1 min-h-0 py-4 px-4 border-2 border-solid border-be-neutral-300 rounded-2xl'>
            <div className='w-3/4 flex flex-col min-h-0'>
              <div className='flex-1 min-h-0 flex flex-col my-2 p-2 bg-gray-100 rounded overflow-y-auto gap-2'>
                {messages.length === 0 && (
                  <p className='text-gray-400 text-sm m-auto'>
                    Start the conversation — your career counselor is ready.
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                      msg.role === 'human'
                        ? 'self-end bg-blue-600 text-white'
                        : 'self-start bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {msg.role === 'ai' && i === messages.length - 1 ? (
                      <TypewriterText text={msg.text} speed={18} />
                    ) : (
                      msg.text
                    )}
                  </div>
                ))}
                {loading && (
                  <div className='self-start bg-white text-gray-400 border border-gray-200 px-3 py-2 rounded-xl text-sm'>
                    Thinking…
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <textarea
                className='w-full h-20 flex-shrink-0'
                autoFocus
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Ask your career question… (Enter to send, Shift+Enter for newline)'
              />
            </div>
            <div className='w-1/4 flex flex-col min-h-0'>
              <div id='canvas-container' className='flex-1 min-h-0 w-full'>
                <Canvas gl={{ antialias: true }}>
                  <Suspense fallback={<Loader />}>
                    <ambientLight intensity={0.1} />
                    <directionalLight color='white' position={[0, 0, 5]} />
                    <Box speed={loading ? 8 : 2} />
                    <OrbitingSphere
                      radius={1.4}
                      speed={loading ? 4.8 : 1.2}
                      tilt={Math.PI / 4}
                      color='#ff8800'
                    />
                    <OrbitingSphere
                      radius={1.0}
                      speed={loading ? 8.0 : 2.0}
                      tilt={-Math.PI / 3}
                      color='#00ffcc'
                    />
                    <EffectComposer>
                      <Bloom
                        intensity={1.5}
                        luminanceThreshold={0.1}
                        luminanceSmoothing={0.9}
                        mipmapBlur
                      />
                    </EffectComposer>
                  </Suspense>
                </Canvas>
              </div>
              <button
                className='w-full h-12 mx-2 mt-1.5 flex-shrink-0'
                type='submit'
                disabled={loading}
              >
                Send
              </button>
              <button
                className='w-full h-8 mx-2 mt-1 flex-shrink-0 text-sm text-gray-500'
                type='button'
                onClick={clearHistory}
              >
                New Chat
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
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
