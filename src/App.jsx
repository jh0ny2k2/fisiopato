import { useEffect, useMemo, useState } from 'react'
import questions from './data/questions.json'
import { saveScore, fetchLeaderboard } from './lib/supabase'

function App() {
  const [name, setName] = useState('')
  const [current, setCurrent] = useState(-1)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [questionStartedAt, setQuestionStartedAt] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const total = questions.length

  const score = useMemo(() => {
    let s = 0
    for (const q of questions) {
      const val = answers[q.id]
      if (val === undefined) continue
      if (q.type === 'multiple' && typeof val === 'number' && val === q.answer) s++
      if (q.type === 'boolean' && typeof val === 'boolean' && val === q.answer) s++
    }
    return s
  }, [answers])

  useEffect(() => {
    if (!submitted) return
    ;(async () => {
      try {
        const { data } = await fetchLeaderboard()
        setLeaderboard(data ?? [])
      } catch {}
    })()
  }, [submitted])

  function startQuiz() {
    if (!name.trim()) return
    setCurrent(0)
    setDurationMs(0)
    setQuestionStartedAt(Date.now())
  }

  function onSelect(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  async function nextQuestion() {
    const now = Date.now()
    const added = questionStartedAt ? (now - questionStartedAt) : 0
    const newDuration = durationMs + added
    setDurationMs(newDuration)
    const next = current + 1
    if (next < total) {
      setCurrent(next)
      setQuestionStartedAt(Date.now())
      return
    }
    setSubmitted(true)
    try {
      if (name && score >= 0) {
        await saveScore({ name, score, total, durationMs: newDuration })
        const { data } = await fetchLeaderboard()
        setLeaderboard(data ?? [])
      }
    } catch {}
  }

  const isNameStage = current === -1
  const question = !isNameStage ? questions[current] : null
  const hasAnswer = question ? answers[question.id] !== undefined : false
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)
  

  return (
    <div className="relative min-h-screen science-bg text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 relative">
        <div className="flex items-center gap-3 mb-8">
          
          <h1 className="text-3xl font-semibold brand-gradient">Fisio Patología UGR</h1>
        </div>

        {isNameStage && (
          <div className="bg-white rounded-xl p-8 shadow-xl">
            <label className="block text-sm font-medium mb-2" htmlFor="name">Tu nombre</label>
            <input
              id="name"
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Escribe tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              onClick={startQuiz}
              className="mt-4 rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-white hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50"
              disabled={!name.trim()}
            >
              Comenzar
            </button>
          </div>
        )}

        {!isNameStage && !submitted && question && (
          <div className="glass rounded-xl p-8 shadow-xl">
            <div className="h-2 w-full rounded bg-white/10 mb-6">
              <div className="h-2 rounded bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${((current + 1) / total) * 100}%` }} />
            </div>
            <p className="font-medium mb-3">{current + 1}. {question.question}</p>
            {question.type === 'multiple' && (
              <div className="space-y-2">
                {question.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      className="size-4 accent-cyan-500"
                      checked={answers[question.id] === i}
                      onChange={() => onSelect(question.id, i)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {question.type === 'boolean' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    className="size-4 accent-cyan-500"
                    checked={answers[question.id] === true}
                    onChange={() => onSelect(question.id, true)}
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    className="size-4 accent-cyan-500"
                    checked={answers[question.id] === false}
                    onChange={() => onSelect(question.id, false)}
                  />
                  <span>No</span>
                </label>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-black">Progreso: {current + 1} / {total}</p>
              <button
                onClick={nextQuestion}
                className="rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-white hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50"
                disabled={!hasAnswer}
              >
                {current + 1 < total ? 'Siguiente' : 'Finalizar'}
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="grid gap-6 ">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-[#22d3ee] px-4 sm:px-8 py-3 sm:py-4 border-b border-black/10">
                <h2 className="text-lg font-semibold">Tu resultado</h2>
                <p className="text-sm text-gray-800">Resumen de tu intento</p>
              </div>
              <div className="p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="relative grid place-items-center w-24 h-24 sm:w-32 sm:h-32">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `conic-gradient(#22d3ee ${(score/total)*100}%, rgba(255,255,255,0.12) ${(score/total)*100}%)` }}
                    />
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-black/30 border border-white/20 grid place-items-center">
                      <div className="text-2xl font-bold">{score}</div>
                      <div className="text-xs text-slate-300">/ {total}</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                    <div className="rounded-lg bg-white/10 border border-black/10 p-4">
                      <div className="text-xs text-black">Aciertos</div>
                      <div className="text-xl font-semibold">{score}/{total}</div>
                    </div>
                    <div className="rounded-lg bg-white/10 border border-black/10 p-4">
                      <div className="text-xs text-black">Tiempo</div>
                      <div className="text-xl font-semibold">{Math.round(durationMs/1000)}s</div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 rounded-lg bg-white/5 border border-black/10 p-4">
                      <div className="text-xs text-black">Criterio</div>
                      <div className="text-sm">Se ordena por aciertos y, en empate, por tiempo.</div>
                    </div>
                  </div>
                  
                </div>
                
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-8 shadow-2xl">
              <h3 className="text-base font-semibold mb-4">Clasificación</h3>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-slate-300">Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para guardar y mostrar la clasificación.</p>
              ) : (
                <div>
                  <div className="mt-2 flex flex-row sm:flex-rwrap sm:flex-ow ite items-centermsm:s-center sm:items-end justify-center gap-6 sm:gap-10 mb-8 sm:mb-12">
                  <div className="relative flex flex-col items-center">
                      <div className="absolute top-8 sm:top-6 left-1/2 -translate-x-1/2 -rotate-6 text-6xl sm:text-8xl font-black text-black/70 z-10 select-none">2</div>
                      <div className="relative z-30 mt-24 sm:mt-34 w-[17036] sm:w-[200px] rounded-md bg-red-700 px-4 py-3 text-center shadow">
                        <div className="text-sm font-bold uppercase truncate">{top3[1]?.name ?? '—'}</div>
                        <div className="text-[11px] text-red-100">{top3[1] ? `${top3[1].score}/${top3[1].total} · ${top3[1].duration_ms ? Math.round(top3[1].duration_ms/1000) : 0}s` : ''}</div>
                      </div>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="absolute left-1/2 -translate-x-1/2 text-7xl sm:text-9xl font-black text-black/70 z-20 select-none">1</div>
                      <div className="relative z-30 mt-20 sm:mt-38 w-[19040] sm:w-[220px] rounded-md bg-red-700 px-5 py-3 text-center shadow">
                        <div className="text-sm font-bold uppercase truncate">{top3[0]?.name ?? '—'}</div>
                        <div className="text-[11px] text-red-100">{top3[0] ? `${top3[0].score}/${top3[0].total} · ${top3[0].duration_ms ? Math.round(top3[0].duration_ms/1000) : 0}s` : ''}</div>
                      </div>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="absolute top-6 sm:top-6 left-1/2 -translate-x-1/2 rotate-6 text-6xl sm:text-8xl font-black text-black/70 z-10 select-none">3</div>
                      <div className="relative z-30 mt-24 sm:mt-34 w-[16036] sm:w-[190px] rounded-md bg-red-700 px-4 py-3 text-center shadow">
                        <div className="text-sm font-bold uppercase truncate">{top3[2]?.name ?? '—'}</div>
                        <div className="text-[11px] text-red-100">{top3[2] ? `${top3[2].score}/${top3[2].total} · ${top3[2].duration_ms ? Math.round(top3[2].duration_ms/1000) : 0}s` : ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 sm:mt-16 rounded-lg overflow-hidden border border-black/10">
                    <div className="grid grid-cols-[48px_1fr_auto] sm:grid-cols-[56px_1fr_auto] items-center gap-3 px-3 sm:px-4 py-2 bg-gray-100 text-gray-900 text-xs sm:text-sm font-semibold tracking-wide">
                      <span>#</span><span>Nombre</span><span>Puntos</span>
                    </div>
                    <ol className="f1-list">
                      {rest.map((row, idx) => (
                        <li key={row.id} title={`${row.score}/${row.total} · ${row.duration_ms ? Math.round(row.duration_ms/1000) : 0}s`} className="f1-row grid grid-cols-[48px_1fr_auto] sm:grid-cols-[56px_1fr_auto] items-center gap-3 px-3 sm:px-4 py-3 text-xs sm:text-sm odd:bg-white/40 even:bg-white/60">
                          <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 text-gray-900 font-black">{idx + 4}</span>
                          <span className="font-bold uppercase tracking-wide truncate">{row.name}</span>
                          <span className="flex items-center gap-1 font-semibold text-gray-900"><span className="text-lg sm:text-xl">{row.score}</span><span className="text-[10px] sm:text-xs text-gray-600">PTS</span></span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
