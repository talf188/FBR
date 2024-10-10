import React, { useState, useEffect, useCallback, useMemo } from 'react';

const ReactorContainer = ({ children, bedHeight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{
      position: 'relative',
      width: '200px',
      height: '400px',
      border: '2px solid black',
      background: 'linear-gradient(to top, #1e3c72, #2a5298)', // Blue gradient
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${bedHeight*0.6}px`,
              borderTop: '2px dashed #ff6b6b',
              transition: 'height 0.5s ease-out'
            }} />
            {children}
          </div>
          <div style={{
            width: '200px',
            height: '25px',
            backgroundColor: 'black',
            marginTop: '2px',
            border: '2px solid black',
            backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 5px 5px'
          }} />
        </div>
      );


const Particle = React.memo(({ x, y, size }) => (
  <div
    style={{
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`,
      borderRadius: '50%',
      backgroundColor: '#ffab91',
      //transition: 'all 0.05s linear',
    }}
  />
));

const SliderContainer = ({ label, value, min, max, step, onChange }) => (
  <div style={{ width: '80%', margin: '20px auto' }}>
    <label>{label}: {value}</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
);

const ReactorVisualization = () => {
  const [velocity, setVelocity] = useState(10);
  const [particleSizeDistribution, setParticleSizeDistribution] = useState(0.5);
  const [particleCount, setParticleCount] = useState(4500);
  const [minParticleSize, setMinParticleSize] = useState(0.05);
  const [maxParticleSize, setMaxParticleSize] = useState(5);
  const [particles, setParticles] = useState([]);

  const reactorHeight = 400;
  const minBedHeight = reactorHeight / 8; // Minimum bed height (no fluidization)
  const maxBedHeight = reactorHeight * 1.3; // Maximum bed height (full fluidization)

  const calculateBedHeight = useCallback(() => {
    if (velocity <= 10) return minBedHeight;
    if (velocity >= 40) return maxBedHeight;
    // Linear interpolation between 10 m/h and 40 m/h
    return minBedHeight + (velocity - 10) / 30 * (maxBedHeight - minBedHeight);
  }, [velocity]);

  const bedHeight = calculateBedHeight();

  const getParticleDistribution = useCallback((size, position) => {
    const sizeRange = maxParticleSize - minParticleSize;
    const normalizedSize = (size - minParticleSize) / sizeRange;
    const normalizedPosition = (position - (reactorHeight - bedHeight)) / bedHeight;
    return Math.abs(normalizedPosition - (1 - normalizedSize));
  }, [minParticleSize, maxParticleSize, bedHeight]);

  const generateParticles = useCallback(() => {
    const newParticles = [];
    const sizeRange = maxParticleSize - minParticleSize;

    for (let i = 0; i < particleCount; i++) {
      const distributionFactor = Math.pow(i / (particleCount - 1), particleSizeDistribution);
      const size = maxParticleSize - (sizeRange * distributionFactor);
      
      const x = Math.random() * 180 + 10;
      const y = reactorHeight - Math.random() * (3/bedHeight);
      newParticles.push({ x, y, size, id: i });
    }

    return newParticles;
  }, [particleSizeDistribution, particleCount, minParticleSize, maxParticleSize, bedHeight]);

  const animateParticles = useCallback(() => {
    const fluidizationFactor = Math.max(0, (velocity - 10) / 30); // 0 at 10 m/h, 1 at 40 m/h

    setParticles(prevParticles => prevParticles.map(particle => {
      const distribution = getParticleDistribution(particle.size, particle.y);
      const maxMovement = 10 * fluidizationFactor * (minParticleSize / particle.size);
      
      const verticalMovement = fluidizationFactor * (Math.random() - 0.5 + (0.5 - distribution)) * 2 * maxMovement;
      const horizontalMovement = fluidizationFactor * (Math.random() - 0.5) * maxMovement;

      let newY = particle.y - verticalMovement;
      newY = Math.max(Math.min(newY, reactorHeight - particle.size / 2), reactorHeight - bedHeight + particle.size / 2);

      let newX = particle.x + horizontalMovement;
      newX = Math.max(Math.min(newX, 190 - particle.size / 2), particle.size / 2);

      return { ...particle, x: newX, y: newY };
    }));
  }, [velocity, minParticleSize, bedHeight, getParticleDistribution]);

  useEffect(() => {
    setParticles(generateParticles());
  }, [generateParticles]);

  useEffect(() => {
    const animationInterval = setInterval(animateParticles, 1);
    return () => clearInterval(animationInterval);
  }, [animateParticles]);

  const memoizedParticles = useMemo(() => particles, [particles]);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Fluidized Bed Reactor Simulation</h2>

      <ReactorContainer bedHeight={bedHeight}>
        {memoizedParticles.map((particle) => (
          <Particle key={particle.id} x={particle.x} y={particle.y} size={particle.size} />
        ))}
      </ReactorContainer>

      <SliderContainer
        label="Fluidization Velocity (m/h)"
        value={velocity}
        min={0}
        max={80}
        step={1}
        onChange={setVelocity}
      />

      <SliderContainer
        label="Particle Size Distribution Factor"
        value={particleSizeDistribution}
        min={0.01}
        max={1}
        step={0.01}
        onChange={setParticleSizeDistribution}
      />

      <SliderContainer
        label="Number of Particles"
        value={particleCount}
        min={1000}
        max={10000}
        step={100}
        onChange={setParticleCount}
      />

      <SliderContainer
        label="Minimum Particle Size (px)"
        value={minParticleSize}
        min={0.01}
        max={1}
        step={0.01}
        onChange={setMinParticleSize}
      />

      <SliderContainer
        label="Maximum Particle Size (px)"
        value={maxParticleSize}
        min={1}
        max={10}
        step={0.1}
        onChange={setMaxParticleSize}
      />
    </div>
  );
};

export default ReactorVisualization;