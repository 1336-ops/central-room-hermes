"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Bot, Shield, FileText, Eye, X, RefreshCw, FolderOpen, Wrench, ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillAgent {
  id: string
  name: string
  role: string
  workspace: string
  skillCount: number
  skills: string[]
}

export default function SkillsPage() {
  const [agentSkills, setAgentSkills] = useState<SkillAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [viewSkill, setViewSkill] = useState<{ agent: string; skill: string; content: string } | null>(null)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [selectedSkill, setSelectedSkill] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("main")
  const [skillUrl, setSkillUrl] = useState("")
  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<{ ok: boolean; message: string } | null>(null)

  const fetchData = () => {
    setLoading(true)
    fetch("/dashboard/api/agents-skills")
      .then(r => r.json())
      .then(d => {
        setAgentSkills(d.agents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const fetchAvailableSkills = () => {
    fetch("/dashboard/api/available-skills")
      .then(r => r.json())
      .then(d => setAvailableSkills(d.skills || []))
      .catch(() => setAvailableSkills([]))
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (showAddSkill) fetchAvailableSkills() }, [showAddSkill])

  const viewSkillContent = (agent: string, skill: string) => {
    fetch(`/dashboard/api/skill-content?agent=${agent}&skill=${skill}`)
      .then(r => r.json())
      .then(d => setViewSkill({ agent, skill, content: d.content || "No content found." }))
      .catch(() => setViewSkill({ agent, skill, content: "Failed to load skill content." }))
  }

  const installSkill = async () => {
    if (!selectedSkill) return;
    setInstalling(true);
    setInstallResult(null);
    try {
      const r = await fetch("/dashboard/api/install-skill-to-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: selectedSkill, agentId: selectedAgent }),
      });
      const d = await r.json();
      setInstallResult({ ok: d.ok, message: d.output || d.error || "Done" });
      if (d.ok) {
        setTimeout(() => {
          fetchData();
          setShowAddSkill(false);
          setSelectedSkill("");
        }, 1500);
      }
    } catch (e: any) {
      setInstallResult({ ok: false, message: e.message });
    } finally {
      setInstalling(false);
    }
  };

  const installFromUrl = async () => {
    if (!skillUrl) return;
    setInstalling(true);
    setInstallResult(null);
    try {
      const r = await fetch("/dashboard/api/install-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: skillUrl, agentId: selectedAgent }),
      });
      const d = await r.json();
      // The endpoint returns {ok, skill, installOut}. Use skill name as message for success.
      const msg = d.ok ? `Installed ${d.skill || d.installOut}` : (d.error || "Failed");
      setInstallResult({ ok: d.ok, message: msg });
      if (d.ok) {
        setTimeout(() => {
          fetchData();
          setSkillUrl("");
        }, 1500);
      }
    } catch (e: any) {
      setInstallResult({ ok: false, message: e.message });
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center animate-pulse">
            <Bot className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-500">Loading agent skills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-grid min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Agent Skills</h2>
          <p className="text-sm text-slate-500 mt-0.5">Skill mapping per agent — workspace-based</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </button>
          <button onClick={() => setShowAddSkill(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-400">Add Skill</span>
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Skill URL (e.g. https://clawskills.sh/skills/xyz)"
              value={skillUrl}
              onChange={e => setSkillUrl(e.target.value)}
              disabled={installing}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500/50"
            />
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              disabled={installing}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="main">GARA (main)</option>
              <option value="law-agent">Law Agent</option>
              <option value="research-agent">Research Agent</option>
              <option value="social-media-agent">Social Media Agent</option>
            </select>
            <button
              onClick={installFromUrl}
              disabled={!skillUrl || installing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <FolderOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400">Install from URL</span>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">{agentSkills.length} agents</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Wrench className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-400">{agentSkills.reduce((a, c) => a + c.skillCount, 0)} skills</span>
          </div>
        </div>
      </div>

      {agentSkills.length === 0 && (
        <Card className="glass-card border-slate-800/50">
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No agents found</p>
          </CardContent>
        </Card>
      )}

      {/* Agent Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {agentSkills.map((agent, i) => {
          const colors = [
            "from-emerald-500 to-teal-600",
            "from-blue-500 to-indigo-600",
            "from-amber-500 to-orange-600",
            "from-violet-500 to-purple-600",
          ]
          const isExpanded = expandedAgent === agent.id

          return (
            <Card key={agent.id} className="glass-card border-slate-800/50 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg shrink-0", colors[i % colors.length])}>
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-semibold text-white">{agent.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                        {agent.skillCount} skill{agent.skillCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400/80 font-medium">{agent.role}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">{agent.workspace}</p>
                  </div>
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Skills list - expanded */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/50">
                    {agent.skills.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No skills installed</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {agent.skills.map(skill => (
                          <button
                            key={skill}
                            onClick={() => viewSkillContent(agent.id, skill)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-700/50 transition-all text-xs text-slate-300 hover:text-cyan-400"
                          >
                            <Zap className="h-3 w-3 text-cyan-500" />
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-700 mt-2">Klik skill untuk lihat isi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Skill Modal */}
      {showAddSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !installing && setShowAddSkill(false)}>
          <Card className="glass-card border-slate-700/50 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cyan-400" />
                  Install Skill
                </h3>
                <button onClick={() => !installing && setShowAddSkill(false)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Pilih skill dari ClawHub</label>
                  <label className="text-xs text-slate-400 mb-1 block">Pilih agen tujuan</label>
                <select
                    value={selectedAgent}
                    onChange={e => setSelectedAgent(e.target.value)}
                    disabled={installing}
                    className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="main">GARA (main)</option>
                    <option value="law-agent">Law Agent</option>
                    <option value="research-agent">Research Agent</option>
                    <option value="social-media-agent">Social Media Agent</option>
                </select>
                <label className="text-xs text-slate-400 mb-1 block">Pilih skill dari ClawHub</label>
                <select
                    value={selectedSkill}
                    onChange={e => setSelectedSkill(e.target.value)}
                    disabled={installing}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">-- Pilih skill --</option>
                    {availableSkills.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {installResult && (
                  <div className={cn("p-3 rounded-lg text-xs", installResult.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}>
                    {installResult.message}
                  </div>
                )}
                <button
                  onClick={installSkill}
                  disabled={!selectedSkill || installing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {installing ? "Installing..." : "Install Skill"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skill Content Modal */}
      {viewSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewSkill(null)}>
          <Card className="glass-card border-slate-700/50 w-full max-w-3xl max-h-[80vh] animate-fade-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  {viewSkill.agent} — {viewSkill.skill}
                </h3>
                <button onClick={() => setViewSkill(null)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-y-auto max-h-[60vh] p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 whitespace-pre-wrap break-words">
                {viewSkill.content}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}