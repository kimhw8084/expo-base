import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import { spawnSync } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const root=process.cwd(); const outDir=path.join(root,'.tmp-form-contracts'); fs.rmSync(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/platform/tsconfig.json','--noEmit','false','--outDir',outDir],{cwd:root,encoding:'utf8'}); if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try { const forms=await import(pathToFileURL(path.join(outDir,'platform/src/forms.js')).href);
  assert.deepEqual(forms.validateText('',{required:'Required'}),{code:'required',message:'Required'});
  assert.deepEqual(forms.validateText('ab',{minLength:{value:3,message:'Too short'}}),{code:'minLength',message:'Too short'});
  assert.equal(forms.validateText('good@example.com',{pattern:{value:/.+@.+\..+/,message:'Invalid'}}),null);
  assert.equal(forms.parseDecimalInput('$12,345.67'),12345.67);
  assert.equal(forms.parseDecimalInput('-42.5'),-42.5);
  assert.equal(forms.parseDecimalInput('not-a-number'),null);
  assert.deepEqual(forms.validateNumber('0',{min:{value:1,message:'Too low'}}),{code:'min',message:'Too low'});
  assert.equal(forms.formatCurrencyInput('1234.5'), '1234.50');
  assert.deepEqual(forms.firstInvalidField([{name:'second',order:2,message:'Bad'},{name:'first',order:1,message:'Required'}]),{name:'first',order:1,message:'Required'});
  assert.equal(forms.firstInvalidField([{name:'ok',order:1}]),null);
  console.log('Form contract tests passed (validation, numeric parsing, deterministic first error).');
} finally {fs.rmSync(outDir,{recursive:true,force:true});}
