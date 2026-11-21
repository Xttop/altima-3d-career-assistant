const start = document.getElementById('questStart');
const status = document.getElementById('questStatus');
const steps = Array.from(document.querySelectorAll('.process-step'), step => ({
  title: step.querySelector('strong').textContent,
  description: step.querySelector('small').textContent,
}));

const width = 960;
const height = 600;
const z = -1.55;
const halfWidth = 0.58;
const halfHeight = halfWidth * height / width;
const controls = [
  { label: 'Wstecz', x: 56, width: 224 },
  { label: 'Dalej', x: 304, width: 224 },
  { label: 'Zamknij AR', x: 680, width: 224 },
];
const controlY = 460;
const controlHeight = 80;

function createProgram(gl) {
  const program = gl.createProgram();
  const sources = [
    [gl.VERTEX_SHADER, `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 projection;
      uniform mat4 view;
      varying vec2 panelUv;
      void main() {
        panelUv = uv;
        gl_Position = projection * view * vec4(position, 1.0);
      }`],
    [gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D panel;
      varying vec2 panelUv;
      void main() { gl_FragColor = texture2D(panel, panelUv); }`],
  ];
  for (const [type, source] of sources) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

function createPanelRenderer(gl) {
  const program = createProgram(gl);
  gl.useProgram(program);
  const geometry = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -halfWidth, -halfHeight, z, 0, 0,
    halfWidth, -halfHeight, z, 1, 0,
    -halfWidth, halfHeight, z, 0, 1,
    halfWidth, halfHeight, z, 1, 1,
  ]), gl.STATIC_DRAW);
  for (const [name, size, offset] of [['position', 3, 0], ['uv', 2, 12]]) {
    const attribute = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 20, offset);
  }
  const projection = gl.getUniformLocation(program, 'projection');
  const view = gl.getUniformLocation(program, 'view');
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.clearColor(0, 0, 0, 0);
  return {
    upload(canvas) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    },
    draw(layer, views) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (const eye of views) {
        const viewport = layer.getViewport(eye);
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
        gl.uniformMatrix4fv(projection, false, eye.projectionMatrix);
        gl.uniformMatrix4fv(view, false, eye.transform.inverse.matrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    },
  };
}

function controlAt(pose) {
  if (!pose) return -1;
  const { position, matrix } = pose.transform;
  const directionZ = -matrix[10];
  if (Math.abs(directionZ) < 0.0001) return -1;
  const distance = (z - position.z) / directionZ;
  if (distance <= 0) return -1;
  const x = ((position.x - matrix[8] * distance) / halfWidth + 1) * width / 2;
  const y = (1 - (position.y - matrix[9] * distance) / halfHeight) * height / 2;
  if (y < controlY || y > controlY + controlHeight) return -1;
  return controls.findIndex(control => x >= control.x && x <= control.x + control.width);
}

function runSession(session, reference, layer, renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  let anchor;
  let step = 0;
  let hover = -1;
  let ended = false;

  function enabled(button) {
    return (button === 0 && step > 0) || (button === 1 && step < steps.length - 1) || button === 2;
  }

  function paint() {
    context.fillStyle = '#0b2143';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#2eddf6';
    context.fillRect(0, 0, width, 9);
    context.font = 'bold 30px sans-serif';
    context.fillText('ALTIMA AI VISION  ·  ' + (step + 1) + ' / ' + steps.length, 56, 82);
    context.fillStyle = '#fff';
    context.font = 'bold 53px sans-serif';
    context.fillText(steps[step].title, 56, 230, 848);
    context.fillStyle = '#c4f3ff';
    context.font = '36px sans-serif';
    context.fillText(steps[step].description, 56, 300, 848);
    context.font = '25px sans-serif';
    context.fillText('Skieruj kontroler na przycisk i naciśnij spust.', 56, 390);
    controls.forEach((button, index) => {
      const active = enabled(index);
      context.fillStyle = active ? (index === hover ? '#146e91' : '#16476a') : '#172d46';
      context.fillRect(button.x, controlY, button.width, controlHeight);
      context.fillStyle = active ? '#fff' : '#8195ac';
      context.font = 'bold 29px sans-serif';
      context.fillText(button.label, button.x + 24, controlY + 50);
    });
    renderer.upload(canvas);
  }

  session.addEventListener('end', () => { ended = true; }, { once: true });
  session.addEventListener('select', event => {
    if (!anchor || ended) return;
    const selected = controlAt(event.frame.getPose(event.inputSource.targetRaySpace, anchor));
    if (!enabled(selected)) return;
    if (selected === 2) {
      session.end().catch(() => {});
      return;
    }
    step += selected === 0 ? -1 : 1;
    paint();
  });

  function draw(_time, frame) {
    if (ended) return;
    session.requestAnimationFrame(draw);
    if (!anchor) {
      const initialPose = frame.getViewerPose(reference);
      if (!initialPose) return;
      anchor = reference.getOffsetReferenceSpace(initialPose.transform);
    }
    const pose = frame.getViewerPose(anchor);
    if (!pose) return;
    const pointed = Array.from(session.inputSources, input => controlAt(frame.getPose(input.targetRaySpace, anchor)))
      .find(enabled) ?? -1;
    if (pointed !== hover) {
      hover = pointed;
      paint();
    }
    renderer.draw(layer, pose.views);
  }

  paint();
  session.requestAnimationFrame(draw);
}

async function initialize() {
  const supported = await navigator.xr?.isSessionSupported('immersive-ar');
  if (!supported) {
    start.hidden = true;
    return;
  }
  start.disabled = false;
  start.addEventListener('click', async () => {
    start.disabled = true;
    let session;
    try {
      session = await navigator.xr.requestSession('immersive-ar');
      session.addEventListener('end', () => {
        start.disabled = false;
        status.textContent = '';
      }, { once: true });
      const gl = document.createElement('canvas').getContext('webgl', { alpha: true, xrCompatible: true });
      if (!gl) throw new Error('WebGL');
      await gl.makeXRCompatible();
      const layer = new XRWebGLLayer(session, gl, { alpha: true });
      session.updateRenderState({ baseLayer: layer });
      const reference = await session.requestReferenceSpace('local');
      runSession(session, reference, layer, createPanelRenderer(gl));
    } catch {
      if (session) await session.end().catch(() => {});
      status.textContent = 'Nie udało się uruchomić AR. Otwórz stronę w Meta Quest Browser i spróbuj ponownie.';
      start.disabled = false;
    }
  });
}

initialize().catch(() => { start.hidden = true; });
