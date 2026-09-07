'use client';
import dynamic from 'next/dynamic';
import {
  ArrowDown,
  ArrowUpRight,
  MapPin,
  Mic2,
  Pause,
  Play,
  Plus,
  Route,
  Square,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
const AtlasScene = dynamic(() => import('./AtlasScene'), { ssr: false });
const memories = [
  {
    code: 'CA',
    state: 'California',
    place: 'Big Sur',
    date: 'May 2025',
    note: 'The coast made time move slower.',
    color: '#ffb35c',
  },
  {
    code: 'CO',
    state: 'Colorado',
    place: 'Rocky Mountain',
    date: 'Sep 2024',
    note: 'Thin air, pine smoke, the wrong turn we kept.',
    color: '#75d8ff',
  },
  {
    code: 'AZ',
    state: 'Arizona',
    place: 'Sedona',
    date: 'Mar 2024',
    note: 'Red dust on everything we owned.',
    color: '#ff8066',
  },
  {
    code: 'NY',
    state: 'New York',
    place: 'Brooklyn',
    date: 'Nov 2023',
    note: 'Rain, neon, and the corner table.',
    color: '#ba9cff',
  },
  {
    code: 'ME',
    state: 'Maine',
    place: 'Acadia',
    date: 'Aug 2023',
    note: 'We woke before the rest of the country.',
    color: '#73f0ca',
  },
];

function VoiceRecorder() {
  const [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [audioUrl, setAudioUrl] = useState(''),
    [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null),
    chunks = useRef<Blob[]>([]),
    timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    recorder.current?.stop();
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  };
  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(
          URL.createObjectURL(new Blob(chunks.current, { type: mr.mimeType })),
        );
      };
      mr.start();
      recorder.current = mr;
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(
        'Microphone access is off. Allow it in your browser, then try again.',
      );
    }
  };
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <div className={`recorder-panel ${recording ? 'recording' : ''}`}>
      <div className="recorder-status">
        <span>
          {recording
            ? 'Recording this moment'
            : audioUrl
              ? 'Audio postcard ready'
              : 'A new audio postcard'}
        </span>
        <b>{time}</b>
      </div>
      <div className="waveform" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <i key={i} style={{ height: `${14 + ((i * 23) % 58)}px` }} />
        ))}
      </div>
      <div className="recorder-actions">
        <button className="record-control" onClick={recording ? stop : start}>
          {recording ? (
            <Square size={17} fill="currentColor" />
          ) : (
            <Mic2 size={19} />
          )}{' '}
          {recording ? 'Finish recording' : 'Start recording'}
        </button>
        {audioUrl && <audio controls src={audioUrl} />}
      </div>
      <div className="recording-for">
        <span>Saving to</span>
        <strong>Arizona · Sunset overlook</strong>
      </div>
      {error && (
        <p className="recorder-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState(0),
    [playing, setPlaying] = useState(false);
  const root = useRef<HTMLElement>(null);
  const memory = memories[active];
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        if (!ctx.conditions?.motion) return;
        gsap.fromTo(
          '.reveal',
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.15,
            stagger: 0.09,
            ease: 'expo.out',
          },
        );
      },
      root.current ?? undefined,
    );
    return () => mm.revert();
  }, []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      '.memory-copy',
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        ease: 'expo.out',
        overwrite: 'auto',
      },
    );
  }, [active]);
  const enterMemory = () =>
    document
      .querySelector('#featured-memory')
      ?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
  return (
    <main ref={root} className="site-shell">
      <section
        className="atlas-stage"
        id="atlas"
        aria-label="Interactive memory atlas"
      >
        <AtlasScene active={active} colors={memories.map((i) => i.color)} />
        <div className="stage-vignette" />
        <nav className="glass topbar reveal" aria-label="Primary navigation">
          <a className="wordmark" href="#atlas">
            <span>W/</span> Wander, together.
          </a>
          <div className="nav-actions">
            <a className="nav-link" href="#featured-memory">
              <Route size={16} /> Our route
            </a>
            <a className="nav-link" href="#voice-notes">
              <Mic2 size={16} /> Voice notes
            </a>
            <button className="icon-button" aria-label="Add a memory">
              <Plus size={19} />
            </button>
          </div>
        </nav>
        <header className="stage-heading reveal">
          <p>25 states · 7 years · one life</p>
          <h1>
            Where
            <br />
            we became <em>us.</em>
          </h1>
        </header>
        <aside className="glass memory-drawer reveal" aria-live="polite">
          <div className="memory-copy" key={memory.code}>
            <div className="drawer-meta">
              <span>{memory.date}</span>
              <span>
                {String(active + 1).padStart(2, '0')} /{' '}
                {String(memories.length).padStart(2, '0')}
              </span>
            </div>
            <p className="location">
              <MapPin size={16} />
              {memory.place}
            </p>
            <h2>{memory.state}</h2>
            <blockquote>“{memory.note}”</blockquote>
            <button className="open-memory" onClick={enterMemory}>
              Enter this memory <ArrowUpRight size={20} />
            </button>
          </div>
        </aside>
        <div className="state-rail reveal" aria-label="Choose a state">
          {memories.map((item, index) => (
            <button
              key={item.code}
              className={active === index ? 'active' : ''}
              onClick={() => setActive(index)}
              aria-pressed={active === index}
            >
              <span style={{ background: item.color }} />
              {item.code}
              <small>{item.state}</small>
            </button>
          ))}
        </div>
        <a className="glass audio-dock reveal" href="#voice-notes">
          <Mic2 size={18} />
          <span>Leave an audio postcard</span>
          <b>00:00</b>
        </a>
        <p className="scene-hint reveal">Drag to wander · select a beacon</p>
      </section>

      <section className="featured-memory" id="featured-memory">
        <div className="memory-index">
          <span>Arizona</span>
          <span>March 16, 2024</span>
        </div>
        <div className="memory-image">
          <img
            src="/media/desert-memory.png"
            alt="Illustrative scene of a couple at a desert overlook at dusk"
          />
          <span className="illustrative-label">
            Illustrative memory · replace with your photograph
          </span>
          <button
            className="sound-button"
            onClick={() => setPlaying(!playing)}
            aria-pressed={playing}
          >
            {playing ? (
              <Pause size={17} />
            ) : (
              <Play size={17} fill="currentColor" />
            )}
            <span>{playing ? 'Pause the moment' : 'Hear the moment'}</span>
          </button>
        </div>
        <article className="story-copy">
          <p className="story-place">
            <MapPin size={15} /> Sedona, Arizona
          </p>
          <h2>
            We stayed until
            <br />
            the desert went <em>blue.</em>
          </h2>
          <p className="story-lead">
            There was no itinerary for this part. Just the last warmth leaving
            the rocks and both of us deciding, without saying it, not to move
            yet.
          </p>
          <div className="story-detail">
            <p>
              The overlook emptied first. Then the road below disappeared. We
              shared the final clementine from the day pack and tried to name
              every color between orange and night.
            </p>
            <blockquote>
              “I think this is the quietest we’ve ever been together.”
              <cite>— somewhere outside Sedona</cite>
            </blockquote>
          </div>
        </article>
        <a
          className="next-marker"
          href="#voice-notes"
          aria-label="Continue to voice notes"
        >
          <ArrowDown size={22} />
        </a>
      </section>

      <section className="voice-notes" id="voice-notes">
        <div className="voice-copy">
          <Volume2 size={30} />
          <h2>
            Keep the way
            <br />
            it <em>sounded.</em>
          </h2>
          <p>
            A story changes every time we tell it. Record the first version
            while the details are still close.
          </p>
          <div className="saved-note">
            <button aria-label="Play saved California voice note">
              <Play size={16} fill="currentColor" />
            </button>
            <span>
              <strong>California · roadside</strong>
              <small>May 17, 2025 · 01:42</small>
            </span>
          </div>
        </div>
        <VoiceRecorder />
      </section>

      <section className="yearbook">
        <div>
          <p>Our route keeps growing.</p>
          <h2>
            Twenty-five states behind us.
            <br />
            <em>Twenty-five still calling.</em>
          </h2>
        </div>
        <div className="future-list">
          <button>
            <span>26</span>Montana<small>Saved for summer</small>
            <ArrowUpRight />
          </button>
          <button>
            <span>27</span>New Mexico<small>Desert skies</small>
            <ArrowUpRight />
          </button>
          <button>
            <span>28</span>Alaska<small>The big someday</small>
            <ArrowUpRight />
          </button>
        </div>
      </section>
      <footer>
        <a className="wordmark" href="#atlas">
          <span>W/</span> Wander, together.
        </a>
        <p>Our favorite place is wherever we both are.</p>
        <small>Private by design · made for two</small>
      </footer>
    </main>
  );
}
