const e=`https://cdn.jsdelivr.net/pyodide/v314.0.7/full/`;let t=null;async function n(){let t=await(await import(
/* @vite-ignore */
`${e}pyodide.mjs`)).loadPyodide({indexURL:e});return await t.runPythonAsync(`import os
os.environ["MPLBACKEND"] = "agg"`),t}const r={pint:`pint`,openpyxl:`openpyxl`,skfem:`scikit-fem`};async function i(e,t){let n=Object.keys(r).filter(e=>RegExp(`^\\s*(from|import)\\s+${e}\\b`,`m`).test(t));if(!n.length)return;e.globals.set(`_pycoil_wanted`,e.toPy(n));let i=e.runPython(`import importlib.util as _u
[m for m in _pycoil_wanted if _u.find_spec(m) is None]`).toJs();i.length&&(await e.loadPackage(`micropip`,{messageCallback:()=>void 0}),e.globals.set(`_pycoil_missing`,e.toPy(i.map(e=>r[e]))),await e.runPythonAsync(`import micropip
await micropip.install(_pycoil_missing)`))}function a(e){let t=e.split(`
`).filter(e=>e.trim()),n=t.findIndex(e=>e.includes(`File "<exec>"`));return(n>=0?t.slice(n):t.slice(-3)).filter(e=>!e.includes(`/lib/python`)&&!e.includes(`_pyodide`)).map(e=>e.replace(`File "<exec>", `,`Riga: `)).join(`
`)}self.onmessage=async e=>{let{id:r,code:o,tests:s}=e.data,c=``,l={id:r,ok:!0,out:``,images:[],testsOk:null};try{t||=n();let e=await t;l.python=e.version,e.setStdout({batched:()=>void 0}),e.setStderr({batched:()=>void 0}),await e.loadPackagesFromImports(`${o}\n${s??``}`,{messageCallback:()=>void 0});try{await i(e,`${o}\n${s??``}`)}catch{l.ok=!1,l.error=`Libreria non disponibile: non riesco a scaricarla da PyPI. Serve la connessione la prima volta.`,l.out=c,self.postMessage(l);return}e.setStdout({batched:e=>c+=e+`
`}),e.setStderr({batched:e=>c+=e+`
`});let r=e.globals.get(`dict`)();try{await e.runPythonAsync(o,{globals:r})}catch(e){l.ok=!1,l.error=a(String(e))}if(l.ok&&s)try{await e.runPythonAsync(s,{globals:r}),l.testsOk=!0}catch(e){l.testsOk=!1;let t=String(e);l.testError=(t.trim().split(`
`).pop()??t).replace(/^AssertionError:?\s*/,``)||`Un controllo non è passato.`}let u=await e.runPythonAsync(`
import sys as _sys
_imgs = []
if "matplotlib.pyplot" in _sys.modules:
    import io as _io, base64 as _b64
    import matplotlib.pyplot as _plt
    for _n in _plt.get_fignums():
        _buf = _io.BytesIO()
        _plt.figure(_n).savefig(_buf, format="png", dpi=110, bbox_inches="tight")
        _imgs.append(_b64.b64encode(_buf.getvalue()).decode())
    _plt.close("all")
_imgs
`,{globals:r});l.images=u.toJs?u.toJs():[],r.destroy?.()}catch(e){l.ok=!1,l.error=`Python non disponibile: ${String(e).slice(0,200)}. Serve la connessione la prima volta.`}l.out=c.replace(/\n$/,``),self.postMessage(l)};