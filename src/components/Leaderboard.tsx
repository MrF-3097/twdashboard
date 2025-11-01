import { useEffect, useMemo, useState } from 'react';

type Row = Record<string, any>;

type Api = { updated?: string; agents?: Row[]; error?: string };

const isBool = (v: any) => v === true || v === false || v === 'TRUE' || v === 'FALSE' || v === 'true' || v === 'false';
const toBool = (v: any) => v === true || v === 'TRUE' || v === 'true';

export default function Leaderboard(){
  const url = process.env.NEXT_PUBLIC_LEADERBOARD_URL as string;
  const [rows, setRows] = useState<Row[]>([]);
  const [updated, setUpdated] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(){
    if (!url) { setErr('Missing NEXT_PUBLIC_LEADERBOARD_URL'); return; }
    setLoading(true);
    try{
      const res = await fetch(url, { cache: 'no-store' });
      const j: Api = await res.json();
      if (j.error) throw new Error(j.error);
      setRows(Array.isArray(j.agents) ? j.agents : []);
      setUpdated(j.updated || '');
      setErr('');
    }catch(e:any){ setErr(e?.message || 'Load failed'); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); const id=setInterval(load, 10000); return ()=>clearInterval(id); },[]);

  const cols = useMemo(()=>{
    const first = rows[0] || {};
    const keys = Object.keys(first);
    const agentKey = keys.find(k=>k.toLowerCase()==='agent') || 'Agent';
    const completedKey = keys.find(k=>k.toLowerCase()==='completedcount') || 'CompletedCount';
    const stampKey = keys.find(k=>k.toLowerCase()==='lastupdate') || 'LastUpdate';
    const groupKeys = keys.filter(k => k.includes('(GROUP)'));
    const questKeys = keys.filter(k => isBool(first[k]) && !groupKeys.includes(k) && k !== agentKey);
    return { agentKey, completedKey, stampKey, questKeys, groupKeys };
  },[rows]);

  const stamp = useMemo(()=>{ if(!updated) return ''; try{ return new Date(updated).toLocaleString('ro-RO'); }catch{ return updated; } },[updated]);

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        {loading && <span className="text-sm animate-pulse">actualizare…</span>}
        {stamp && <span className="text-sm text-gray-500">Ultima actualizare: {stamp}</span>}
        {err && <span className="text-sm text-red-600">Eroare: {err}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="py-2 pr-4">Agent</th>
              {cols.questKeys.map(k=> (<th key={k} className="py-2 pr-4 whitespace-nowrap">{k}</th>))}
              <th className="py-2 pr-4">Completed</th>
              <th className="py-2 pr-4">LastUpdate</th>
              {cols.groupKeys.map(k=> (<th key={k} className="py-2 pr-4 whitespace-nowrap">{k}</th>))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i)=> (
              <tr key={i} className="border-b last:border-b-0">
                <td className="py-2 pr-4 whitespace-nowrap">{r[cols.agentKey] ?? ''}</td>
                {cols.questKeys.map(k=> (<td key={k} className="py-2 pr-4 text-center">{toBool(r[k]) ? '✓' : ''}</td>))}
                <td className="py-2 pr-4">{r[cols.completedKey] ?? ''}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{r[cols.stampKey] ? new Date(r[cols.stampKey]).toLocaleString('ro-RO') : ''}</td>
                {cols.groupKeys.map(k=> (<td key={k} className="py-2 pr-4 text-center">{toBool(r[k]) ? '✓' : ''}</td>))}
              </tr>
            ))}
            {rows.length===0 && (<tr><td colSpan={4} className="py-6 text-center text-gray-500">Nicio înregistrare</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

