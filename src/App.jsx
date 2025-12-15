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
        <div className="flex items-center justify-between bg-white rounded-xl p-3 sm:p-4 shadow-2xl mb-8 border border-black/10">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/Gemini_Generated_Image_imd0krimd0krimd0-removebg-preview.png" alt="" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            <h1 className="text-2xl sm:text-3xl font-semibold brand-gradient">Fisio Patología UGR</h1>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-full bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1">Quiz</span>
        </div>

        {isNameStage && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-black/10">
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
              <img src="/Gemini_Generated_Image_imd0krimd0krimd0-removebg-preview.png" alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              <div className="text-lg sm:text-xl font-semibold">¿Cómo te llamas?</div>
              <div className="text-xs sm:text-sm text-gray-600">Guardaremos tu nombre en la clasificación</div>
            </div>
            <div className="mt-4 sm:mt-5">
              <input
                id="name"
                className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base sm:text-lg outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Escribe tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) startQuiz() }}
              />
            </div>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
              <button
                onClick={startQuiz}
                className="w-full sm:w-auto rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 text-white text-sm sm:text-base font-medium hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50"
                disabled={!name.trim()}
              >
                Comenzar
              </button>
            </div>
          </div>
        )}

        {!isNameStage && !submitted && question && (
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl border border-black/10">
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Pregunta {current + 1} de {total}</span>
                <span>{Math.round(((current + 1)/ total) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded bg-gray-200">
                <div className="h-2 rounded bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${((current + 1) / total) * 100}%` }} />
              </div>
            </div>
            <p className="text-base sm:text-lg font-semibold mb-4">{question.question}</p>
            {question.type === 'multiple' && (
              <div className="space-y-2">
                {question.options.map((opt, i) => (
                  <label key={i} className="group flex items-center gap-3 rounded-lg px-4 py-3 bg-gray-50 border border-black/10 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      className="size-4 accent-cyan-500"
                      checked={answers[question.id] === i}
                      onChange={() => onSelect(question.id, i)}
                    />
                    <span className="text-sm sm:text-base">{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {question.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="group flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-gray-50 border border-black/10 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    className="size-4 accent-cyan-500"
                    checked={answers[question.id] === true}
                    onChange={() => onSelect(question.id, true)}
                  />
                  <span className="text-sm sm:text-base font-medium">Sí</span>
                </label>
                <label className="group flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-gray-50 border border-black/10 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    className="size-4 accent-cyan-500"
                    checked={answers[question.id] === false}
                    onChange={() => onSelect(question.id, false)}
                  />
                  <span className="text-sm sm:text-base font-medium">No</span>
                </label>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Progreso: {current + 1} / {total}</p>
              <button
                onClick={nextQuestion}
                className="rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 text-white text-sm sm:text-base font-medium hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50"
                disabled={!hasAnswer}
              >
                {current + 1 < total ? 'Siguiente' : 'Finalizar'}
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="grid gap-6 ">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl border border-black/10">
              <div className="bg-[#22d3ee] text-white px-4 sm:px-8 py-3 sm:py-4">
                <h2 className="text-lg font-semibold">Tu resultado</h2>
                <p className="text-sm text-white/90">Resumen de tu intento</p>
              </div>
              <div className="p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="relative grid place-items-center w-24 h-24 sm:w-32 sm:h-32">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `conic-gradient(#22d3ee ${(score/total)*100}%, rgba(0,0,0,0.08) ${(score/total)*100}%)` }}
                    />
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white border border-black/10 grid place-items-center">
                      <div className="text-2xl font-bold text-gray-900">{score}</div>
                      <div className="text-xs text-gray-600">/ {total}</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
                    <div className="rounded-lg bg-gray-50 border border-black/10 p-4">
                      <div className="text-xs text-gray-600">Aciertos</div>
                      <div className="text-2xl font-semibold text-gray-900">{score}/{total}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-black/10 p-4">
                      <div className="text-xs text-gray-600">Tiempo</div>
                      <div className="text-2xl font-semibold text-gray-900">{Math.round(durationMs/1000)}s</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-black/10 p-4">
                      <div className="text-xs text-gray-600">Porcentaje</div>
                      <div className="text-2xl font-semibold text-gray-900">{Math.round((score/total)*100)}%</div>
                    </div>
                    <div className="col-span-1 sm:col-span-3 rounded-lg bg-white border border-black/10 p-4">
                      <div className="text-xs text-gray-600">Criterio</div>
                      <div className="text-sm text-gray-900">Se ordena por aciertos y, en empate, por tiempo.</div>
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
                      <div className="absolute top-8 sm:top-6 left-1/2 -translate-x-1/2  text-6xl sm:text-8xl font-black text-black/70 z-10 select-none bg-gray-100 py-4 px-18 rounded">2</div>
                      <div className="relative z-30 mt-24 sm:mt-34 w-[17036] sm:w-[200px] rounded-md bg-red-700 px-4 py-3 text-center shadow">
                        <div className="text-sm font-bold uppercase truncate">{top3[1]?.name ?? '—'}</div>
                        <div className="text-[11px] text-red-100">{top3[1] ? `${top3[1].score}/${top3[1].total} · ${top3[1].duration_ms ? Math.round(top3[1].duration_ms/1000) : 0}s` : ''}</div>
                      </div>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="absolute left-1/2 -translate-x-1/2 text-7xl sm:text-9xl bg-gray-100 py-4 px-20 rounded font-black text-black/70 z-20 select-none  ">1</div>
                      <div className="relative z-30 mt-20 sm:mt-38 w-[19040] sm:w-[220px] rounded-md bg-red-700 px-5 py-3 text-center shadow">
                        <div className="text-sm font-bold uppercase truncate">{top3[0]?.name ?? '—'}</div>
                        <div className="text-[11px] text-red-100">{top3[0] ? `${top3[0].score}/${top3[0].total} · ${top3[0].duration_ms ? Math.round(top3[0].duration_ms/1000) : 0}s` : ''}</div>
                      </div>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="absolute top-6 sm:top-6 left-1/2 -translate-x-1/2 text-6xl sm:text-8xl font-black text-black/70 z-10 select-none bg-gray-100 py-4 px-17 rounded">3</div>
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
