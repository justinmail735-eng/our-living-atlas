'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Download,
  Heart,
  ImagePlus,
  MapPin,
  Mic,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  blankMemory,
  fileData,
  MAX_FILE,
  moods,
  readMemories,
  removeMemory,
  saveMemories,
  states,
  visited,
  destinationLabel,
  validateBackup,
  type Memory,
} from '@/lib/memories';
import './memories.css';
const AtlasScene = dynamic(() => import('./AtlasScene'), { ssr: false });
const colors = ['#ffb35c', '#75d8ff', '#ff8066', '#ba9cff', '#73f0ca'];
const featured = ['Texas', 'California', 'Arizona', 'Hawaii', 'Maldives'];
const hints = [
  'Home. Where every journey begins and ends.',
  'A little light from the long way home.',
  'Stay until the desert turns blue.',
  'An island chapter, waiting for your stories.',
  'Somewhere between the sea and the sky.',
];

function Editor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Memory;
  onSave: (m: Memory) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [requesting, setRequesting] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    mounted = useRef(true),
    chunks = useRef<Blob[]>([]);
  useEffect(() => {
    mounted.current = true;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      mounted.current = false;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  function field<K extends keyof Memory>(key: K, value: Memory[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function addPhotos(files: FileList | File[] | null) {
    if (!files) return;
    setBusy(true);
    setError('');
    try {
      const list = Array.from(files);
      if (draft.photos.length + list.length > 30)
        throw new Error(
          'Keep each memory to 30 photos. You can create another memory for the same trip.',
        );
      if (
        list.some(
          (f) =>
            !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
            f.size > MAX_FILE,
        )
      )
        throw new Error(
          'Use JPG, PNG or WebP photos under 15 MB each. Export HEIC photos as JPG first.',
        );
      const added = await Promise.all(
        list.map(async (f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          caption: '',
          data: await fileData(f),
        })),
      );
      setDraft((d) => ({ ...d, photos: [...d.photos, ...added] }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function record() {
    setError('');
    setRequesting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error(
          'Recording needs HTTPS or localhost and a browser with microphone support. You can attach an audio file instead.',
        );
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const mr = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      recorder.current = mr;
      chunks.current = [];
      let bytes = 0;
      mr.ondataavailable = (e) => {
        chunks.current.push(e.data);
        bytes += e.data.size;
        if (bytes > MAX_FILE && mr.state === 'recording') mr.stop();
      };
      mr.onstop = async () => {
        s.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        if (!mounted.current) return;
        setRecording(false);
        setBusy(true);
        try {
          const blob = new Blob(chunks.current, { type: mr.mimeType });
          if (blob.size > MAX_FILE)
            throw new Error(
              'This recording is too large. Please record a shorter note (under 15 MB).',
            );
          field('audio', await fileData(blob));
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      };
      mr.onerror = () => {
        s.getTracks().forEach((t) => t.stop());
        setError('Recording stopped unexpectedly. Please try again.');
        setRecording(false);
        if (timer.current) clearInterval(timer.current);
      };
      mr.start(1000);
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
    } catch (e) {
      setError(
        (e as Error).name === 'NotAllowedError'
          ? 'Microphone permission was declined. Allow it in your browser or attach an audio file.'
          : (e as Error).message,
      );
    } finally {
      setRequesting(false);
    }
  }
  async function attachAudio(f?: File) {
    if (!f) return;
    setError('');
    if (
      ![
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/mpeg',
        'audio/wav',
        'audio/x-wav',
      ].includes(f.type) ||
      f.size > MAX_FILE
    ) {
      setError('Choose MP3, M4A, WAV, OGG or WebM audio under 15 MB.');
      return;
    }
    setBusy(true);
    try {
      field('audio', await fileData(f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="memory-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          if (!draft.title.trim()) throw new Error('Give this memory a title.');
          await onSave({
            ...draft,
            title: draft.title.trim(),
            updated: Date.now(),
          });
        } catch (e) {
          setError((e as Error).message);
          setBusy(false);
        }
      }}
    >
      <div className="editor-heading">
        <div>
          <p>Your next little forever</p>
          <h2>
            {initial.title ? 'Edit this memory' : 'Make room for a memory.'}
          </h2>
        </div>
        <button
          type="button"
          className="quiet"
          onClick={onCancel}
          disabled={recording || busy || requesting}
        >
          <X size={20} /> Close
        </button>
      </div>
      <div className="editor-grid">
        <section>
          <label
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) addPhotos(e.dataTransfer.files);
            }}
          >
            <ImagePlus size={34} />
            <strong>Bring your photos here</strong>
            <span>Drop photos or choose from your device</span>
            <small>JPG, PNG, WebP · up to 30 photos · 15 MB each</small>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          {draft.photos.length > 0 && (
            <div className="photo-editor">
              {draft.photos.map((photo, i) => (
                <div key={photo.id}>
                  <img src={photo.data} alt={photo.caption || photo.name} />
                  <div className="photo-tools">
                    <small>
                      {i === 0
                        ? 'Cover photo'
                        : `${i + 1} of ${draft.photos.length}`}
                    </small>
                    <button
                      type="button"
                      aria-label={`Remove ${photo.name}`}
                      onClick={() =>
                        field(
                          'photos',
                          draft.photos.filter((p) => p.id !== photo.id),
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    aria-label={`Caption for ${photo.name}`}
                    placeholder="What do you remember about this photo?"
                    maxLength={500}
                    value={photo.caption}
                    onChange={(e) =>
                      field(
                        'photos',
                        draft.photos.map((p) =>
                          p.id === photo.id
                            ? { ...p, caption: e.target.value }
                            : p,
                        ),
                      )
                    }
                  />
                  {i > 0 && (
                    <button
                      type="button"
                      className="quiet"
                      onClick={() =>
                        field('photos', [
                          photo,
                          ...draft.photos.filter((p) => p.id !== photo.id),
                        ])
                      }
                    >
                      Make cover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="voice-studio">
            <Mic size={24} />
            <h3>Tell it in your own voice.</h3>
            <p>
              What happened just before this picture? What made you both laugh?
            </p>
            <div
              className={'voice-bars ' + (recording ? 'live' : '')}
              aria-hidden="true"
            >
              {Array.from({ length: 32 }, (_, i) => (
                <i key={i} style={{ height: 12 + ((i * 19) % 42) }} />
              ))}
            </div>
            <div className="button-row">
              <button
                type="button"
                className="primary"
                disabled={busy || requesting}
                onClick={() =>
                  recording ? recorder.current?.stop() : record()
                }
              >
                {recording ? <Square size={16} /> : <Mic size={16} />}{' '}
                {recording
                  ? `Finish · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
                  : requesting
                    ? 'Waiting for microphone…'
                    : draft.audio
                      ? 'Record replacement'
                      : 'Record a voice note'}
              </button>
              <label className="quiet file-button">
                Attach audio
                <input
                  type="file"
                  accept="audio/*"
                  disabled={busy || recording || requesting}
                  onChange={(e) => {
                    attachAudio(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {draft.audio && (
              <>
                <audio controls src={draft.audio} />
                <button
                  type="button"
                  className="quiet"
                  onClick={() => field('audio', '')}
                  disabled={recording}
                >
                  Remove audio
                </button>
              </>
            )}
          </div>
        </section>
        <section className="form-fields">
          <label>
            Memory title
            <input
              required
              maxLength={120}
              value={draft.title}
              placeholder="The sunset we almost missed"
              onChange={(e) => field('title', e.target.value)}
            />
          </label>
          <div className="field-pair">
            <label>
              Destination
              <select
                value={draft.state}
                onChange={(e) => field('state', e.target.value)}
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {destinationLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={draft.date}
                onChange={(e) => field('date', e.target.value)}
              />
            </label>
          </div>
          <label>
            Place or trip name
            <input
              maxLength={160}
              value={draft.place}
              placeholder="Big Sur · anniversary road trip"
              onChange={(e) => field('place', e.target.value)}
            />
          </label>
          <label>
            The story
            <textarea
              rows={8}
              maxLength={30000}
              value={draft.story}
              placeholder="Start with the detail you never want to forget…"
              onChange={(e) => field('story', e.target.value)}
            />
          </label>
          <label>
            Told by
            <input
              maxLength={80}
              value={draft.author}
              placeholder="Your name, her name, or Together"
              onChange={(e) => field('author', e.target.value)}
            />
          </label>
          <fieldset>
            <legend>How did it feel?</legend>
            <div className="mood-options">
              {moods.map((m) => (
                <label key={m}>
                  <input
                    type="radio"
                    name="mood"
                    value={m}
                    checked={draft.mood === m}
                    onChange={() => field('mood', m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="check-label">
            <input
              type="checkbox"
              checked={draft.favorite}
              onChange={(e) => field('favorite', e.target.checked)}
            />{' '}
            Keep among our favorites
          </label>
          <p className="storage-note">
            Saved on this browser and device. Export a backup to keep a copy or
            move memories to another device.
          </p>
          {error && (
            <p role="alert" className="error-note">
              {error}
            </p>
          )}
          <button
            className="primary save-button"
            disabled={busy || recording || requesting}
          >
            <Check size={18} />
            {busy ? 'Working…' : 'Save our memory'}
          </button>
        </section>
      </div>
    </form>
  );
}

function Viewer({ memory, onEdit }: { memory: Memory; onEdit: () => void }) {
  const [index, setIndex] = useState(0),
    [slideshow, setSlideshow] = useState(false);
  useEffect(() => {
    if (!slideshow || memory.photos.length < 2) return;
    const t = setInterval(
      () => setIndex((n) => (n + 1) % memory.photos.length),
      5000,
    );
    return () => clearInterval(t);
  }, [slideshow, memory.photos.length]);
  const photo = memory.photos[index];
  return (
    <div
      className={'memory-view mood-' + moods.indexOf(memory.mood)}
      onKeyDown={(e) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
          return;
        if (e.key === 'ArrowRight')
          setIndex((n) => (n + 1) % Math.max(1, memory.photos.length));
        if (e.key === 'ArrowLeft')
          setIndex(
            (n) =>
              (n - 1 + memory.photos.length) %
              Math.max(1, memory.photos.length),
          );
      }}
    >
      <div className="viewer-image">
        {photo ? (
          <img src={photo.data} alt={photo.caption || memory.title} />
        ) : (
          <div className="no-photo">
            <Mic size={40} />
            <p>A memory in words and sound.</p>
          </div>
        )}
        {memory.photos.length > 1 && (
          <div className="viewer-controls">
            <button
              aria-label="Previous photo"
              onClick={() => {
                setSlideshow(false);
                setIndex(
                  (n) => (n - 1 + memory.photos.length) % memory.photos.length,
                );
              }}
            >
              <ArrowLeft />
            </button>
            <span>
              {index + 1} / {memory.photos.length}
            </span>
            <button
              aria-label={slideshow ? 'Pause slideshow' : 'Play slideshow'}
              onClick={() => setSlideshow(!slideshow)}
            >
              {slideshow ? <Pause /> : <Play />}
            </button>
            <button
              aria-label="Next photo"
              onClick={() => {
                setSlideshow(false);
                setIndex((n) => (n + 1) % memory.photos.length);
              }}
            >
              <ArrowRight />
            </button>
          </div>
        )}
        {photo?.caption && <p className="viewer-caption">{photo.caption}</p>}
      </div>
      <article>
        <p className="location">
          <MapPin size={16} />
          {memory.place || memory.state} {memory.date && `· ${memory.date}`}
        </p>
        <DialogTitle>{memory.title}</DialogTitle>
        <DialogDescription>
          {memory.state} · Told by {memory.author || 'Together'}
        </DialogDescription>
        <p className="viewer-story">
          {memory.story ||
            'There is room for the story whenever you are ready.'}
        </p>
        {memory.audio && (
          <div className="viewer-audio">
            <span>
              <Mic size={17} /> Listen to the memory
            </span>
            <audio controls src={memory.audio} />
          </div>
        )}
        <button className="quiet" onClick={onEdit}>
          Add to this story <ArrowUpRight size={18} />
        </button>
      </article>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState<Memory[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [selected, setSelected] = useState('Texas'),
    [query, setQuery] = useState(''),
    [year, setYear] = useState('all'),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [editor, setEditor] = useState<Memory | null>(null),
    [view, setView] = useState<Memory | null>(null),
    [deleting, setDeleting] = useState<Memory | null>(null),
    [working, setWorking] = useState(false),
    [ambient, setAmbient] = useState(false);
  const importInput = useRef<HTMLInputElement>(null),
    audioContext = useRef<AudioContext | null>(null);
  useEffect(() => {
    readMemories()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
    return () => {
      void audioContext.current?.close();
    };
  }, []);
  const active = featured.indexOf(selected),
    stateItems = items.filter((m) => m.state === selected),
    years = [...new Set(items.map((m) => m.date.slice(0, 4)).filter(Boolean))]
      .sort()
      .reverse();
  const visible = items
    .filter(
      (m) =>
        (selected === 'all' || m.state === selected) &&
        (year === 'all' || m.date.startsWith(year)) &&
        (!onlyFavorites || m.favorite) &&
        `${m.title} ${m.story} ${m.place} ${m.state}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        (b.date || '').localeCompare(a.date || '') || b.updated - a.updated,
    );
  function add() {
    if (editor) {
      document
        .getElementById('compose')
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setEditor(blankMemory(selected === 'all' ? 'California' : selected));
    setTimeout(
      () =>
        document
          .getElementById('compose')
          ?.scrollIntoView({ behavior: 'smooth' }),
      0,
    );
  }
  async function save(m: Memory) {
    await saveMemories([m]);
    setItems((old) => [m, ...old.filter((i) => i.id !== m.id)]);
    setEditor(null);
    setSelected(m.state);
    setNotice('Your memory is saved on this device.');
    document
      .getElementById('collection')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
  async function toggleAmbient() {
    try {
      if (audioContext.current) {
        await audioContext.current.close();
        audioContext.current = null;
        setAmbient(false);
        return;
      }
      const ctx = new AudioContext();
      audioContext.current = ctx;
      await ctx.resume();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 2);
      gain.connect(ctx.destination);
      [130.81, 196, 261.63].forEach((f) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(gain);
        o.start();
      });
      setAmbient(true);
    } catch {
      setError('Ambient sound is unavailable in this browser.');
    }
  }
  async function exportBackup() {
    setWorking(true);
    try {
      const data = await readMemories();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify({ version: 1, memories: data })], {
          type: 'application/json',
        }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `wander-together-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNotice('Backup downloaded with your photos, stories and audio.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    setWorking(true);
    setError('');
    try {
      if (file.size > 250 * 1024 * 1024)
        throw new Error('Choose a backup smaller than 250 MB.');
      const imported = validateBackup(JSON.parse(await file.text()));
      const existing = await readMemories();
      const ids = new Set(existing.map((m) => m.id));
      const unique = imported.filter((m) => !ids.has(m.id));
      await saveMemories(unique);
      setItems([...existing, ...unique]);
      setSelected('all');
      setNotice(
        `Restored ${unique.length} memories. Existing memories were kept.`,
      );
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? 'This file is not a valid backup.'
          : (e as Error).message,
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <main className="memory-home">
      <nav className="glass memory-nav">
        <a className="wordmark" href="#home">
          <span>W/</span> Wander, together.
        </a>
        <div>
          <a href="#collection">Our memories</a>
          <button
            className="quiet ambient-toggle"
            onClick={toggleAmbient}
            aria-pressed={ambient}
          >
            {ambient ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>Ambience {ambient ? 'on' : 'off'}</span>
          </button>
          <button className="primary" disabled={!ready} onClick={add}>
            <Plus size={18} /> Add a memory
          </button>
        </div>
      </nav>
      <section className="memory-hero" id="home">
        <div className="ambient-scene">
          <AtlasScene active={Math.max(0, active)} colors={colors} />
        </div>
        <div className="hero-wash" />
        <div className="hero-intro">
          <h1>
            A life together.
            <br />
            <em>A thousand little forevers.</em>
          </h1>
          <p>
            The places are only the beginning.
            <br />
            Keep the way it felt to be there, with each other.
          </p>
          <a className="quiet" href="#collection">
            Wander through our memories <ArrowRight size={18} />
          </a>
        </div>
        <div className="glass chapter-preview">
          <span className="chapter-coordinate">
            <MapPin size={16} />{' '}
            {selected === 'all' ? 'Our collection' : destinationLabel(selected)}
          </span>
          <h2>{selected === 'all' ? 'Everywhere, together.' : selected}</h2>
          <p>
            {stateItems[0]?.title ||
              (active >= 0 ? hints[active] : 'A place for your next story.')}
          </p>
          <div className="chapter-bottom">
            <span>
              {selected === 'all' ? items.length : stateItems.length} memories
              saved
            </span>
            <button
              className="quiet"
              onClick={() =>
                document
                  .getElementById('collection')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Explore <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        <div className="chapter-rail">
          {featured.map((s, i) => (
            <button
              className={selected === s ? 'chosen' : ''}
              onClick={() => setSelected(s)}
              key={s}
            >
              <i style={{ background: colors[i] }} />
              {s}
            </button>
          ))}
        </div>
        <span className="scene-caption">
          An abstract atlas · drag to explore
        </span>
      </section>
      <section className="collection-section" id="collection">
        <div className="collection-title">
          <div>
            <h2>
              Our little collection
              <br />
              of <em>remember when.</em>
            </h2>
            <p>
              {items.length
                ? `${items.length} memories · ${new Set(items.map((m) => m.state)).size} destinations filled with stories`
                : '17 destinations already part of your story. Texas is home.'}
            </p>
          </div>
          <button
            className="quiet"
            onClick={() => {
              setSelected('all');
              setQuery('');
              setYear('all');
              setOnlyFavorites(false);
            }}
          >
            View everything <ArrowUpRight size={18} />
          </button>
        </div>
        <div
          className="visited-destinations"
          aria-label="Places we have visited"
        >
          {visited.map((place) => (
            <button
              key={place}
              className={selected === place ? 'selected' : ''}
              aria-pressed={selected === place}
              onClick={() => setSelected(place)}
            >
              <MapPin size={14} />
              {destinationLabel(place)}
              <small>
                {items.filter((m) => m.state === place).length || '＋'}
              </small>
            </button>
          ))}
        </div>
        <div className="collection-filters">
          <label className="search-box">
            <Search size={18} />
            <input
              aria-label="Search memories"
              placeholder="Find a place, a feeling, a memory…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="filter-select">
            <span>Place</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="all">All destinations</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {destinationLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span>Year</span>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <button
            className={'quiet ' + (onlyFavorites ? 'favorite-active' : '')}
            aria-pressed={onlyFavorites}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Heart size={18} /> Favorites
          </button>
        </div>
        {error && (
          <div className="error-note" role="alert">
            {error}
            <button
              className="quiet"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <p className="notice" role="status">
            <Check size={16} />
            {notice}
          </p>
        )}
        {!ready ? (
          <p role="status">Opening your collection…</p>
        ) : visible.length ? (
          <div className="memory-gallery">
            {visible.map((m, i) => (
              <article
                key={m.id}
                className={'memory-tile mood-' + moods.indexOf(m.mood)}
              >
                <button className="tile-open" onClick={() => setView(m)}>
                  {m.photos[0] ? (
                    <img
                      loading="lazy"
                      src={m.photos[0].data}
                      alt={m.photos[0].caption || m.title}
                    />
                  ) : (
                    <div className="tile-placeholder">
                      {m.audio ? <Mic size={32} /> : <Sparkles size={32} />}
                      <span>
                        {m.story
                          ? 'A story worth keeping.'
                          : 'A moment, waiting to unfold.'}
                      </span>
                    </div>
                  )}
                  <div className="tile-copy">
                    <span>
                      {m.state} {m.date && `· ${m.date.slice(0, 4)}`}
                    </span>
                    <h3>{m.title}</h3>
                    <p>{m.place || m.mood}</p>
                    <small>
                      {m.photos.length} photos{m.audio ? ' · Voice note' : ''}
                    </small>
                  </div>
                </button>
                <div className="tile-actions">
                  <button
                    aria-label={
                      m.favorite ? 'Unfavorite memory' : 'Favorite memory'
                    }
                    aria-pressed={m.favorite}
                    onClick={async () => {
                      try {
                        const changed = { ...m, favorite: !m.favorite };
                        await saveMemories([changed]);
                        setItems((old) =>
                          old.map((x) => (x.id === m.id ? changed : x)),
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <Heart
                      size={18}
                      fill={m.favorite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setEditor(m);
                      setTimeout(
                        () =>
                          document
                            .getElementById('compose')
                            ?.scrollIntoView({ behavior: 'smooth' }),
                        0,
                      );
                    }}
                  >
                    Edit
                  </button>
                  <button
                    aria-label={`Delete ${m.title}`}
                    onClick={() => setDeleting(m)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-memory">
            <div className="empty-image">
              <img
                src="/media/desert-memory.png"
                alt="Illustrative couple at a desert overlook"
              />
              <span>Illustration · your photographs will live here</span>
            </div>
            <div>
              <Camera size={32} />
              <h3>
                {items.length
                  ? 'There are more memories elsewhere.'
                  : 'One photo starts a whole story.'}
              </h3>
              <p>
                {items.length
                  ? 'Try another state or year, or add a new memory right here.'
                  : 'A sunset. A missed turn. The two of you laughing at nothing. Add it now, or come back when you’re ready.'}
              </p>
              <button className="primary" onClick={add}>
                <Plus size={18} />{' '}
                {items.length ? 'Add a memory here' : 'Add our first memory'}
              </button>
            </div>
          </div>
        )}
      </section>
      {editor && (
        <section id="compose">
          <Editor
            key={editor.id}
            initial={editor}
            onSave={save}
            onCancel={() => setEditor(null)}
          />
        </section>
      )}
      <section className="keepsake-section">
        <div>
          <Mic size={26} />
          <h2>
            Someday, you’ll want
            <br />
            to hear <em>this version of you.</em>
          </h2>
          <p>
            Every memory has space for photographs, captions, a written story
            and your voice. Nothing needs to be perfect to be worth keeping.
          </p>
          <button className="quiet" onClick={add}>
            Leave a story for your future selves <ArrowRight size={18} />
          </button>
        </div>
        <div className="glass backup-panel">
          <Download size={24} />
          <h3>Keep a copy close.</h3>
          <p>
            This collection lives in this browser, on this device. A backup
            carries your photographs and recordings with it. Shared online
            storage isn’t connected yet.
          </p>
          <div className="button-row">
            <button
              className="quiet"
              disabled={working || !ready}
              onClick={exportBackup}
            >
              <Download size={17} /> Export backup
            </button>
            <button
              className="quiet"
              disabled={working || !ready}
              onClick={() => importInput.current?.click()}
            >
              <Upload size={17} /> Restore backup
            </button>
            <input
              hidden
              ref={importInput}
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                importBackup(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          {working && <p role="status">Preparing your memories…</p>}
        </div>
      </section>
      <footer>
        <a className="wordmark" href="#home">
          <span>W/</span> Wander, together.
        </a>
        <p>Our favorite place is wherever we both are.</p>
        <small>Stored on this device · made for two</small>
      </footer>
      <Dialog
        open={!!view}
        onOpenChange={(open) => {
          if (!open) setView(null);
        }}
      >
        <DialogContent className="memory-dialog">
          {view && (
            <Viewer
              key={view.id}
              memory={view}
              onEdit={() => {
                setEditor(view);
                setView(null);
                setTimeout(
                  () =>
                    document
                      .getElementById('compose')
                      ?.scrollIntoView({ behavior: 'smooth' }),
                  0,
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !working) setDeleting(null);
        }}
      >
        <DialogContent className="delete-dialog">
          <DialogTitle>Remove this memory?</DialogTitle>
          <DialogDescription>
            “{deleting?.title}” and its photos and audio will be removed from
            this browser. Export a backup first if you want to keep a copy.
          </DialogDescription>
          <div className="button-row">
            <button
              className="quiet"
              disabled={working}
              onClick={() => setDeleting(null)}
            >
              Keep it
            </button>
            <button
              className="primary"
              disabled={working}
              onClick={async () => {
                if (!deleting) return;
                setWorking(true);
                try {
                  await removeMemory(deleting.id);
                  setItems((old) => old.filter((m) => m.id !== deleting.id));
                  setDeleting(null);
                  setNotice('Memory removed from this device.');
                } catch (e) {
                  setError((e as Error).message);
                  setDeleting(null);
                } finally {
                  setWorking(false);
                }
              }}
            >
              Remove memory
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
