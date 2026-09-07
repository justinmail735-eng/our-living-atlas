import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankMemory, validateBackup, visited, destinationLabel } from '../lib/memories.ts';
const example=()=>({...blankMemory('Texas'),title:'Back home',date:'2026-09-07',photos:[{id:'photo',name:'sunset.png',caption:'Together',data:'data:image/png;base64,YQ=='}],audio:'data:audio/webm;codecs=opus;base64,YQ=='});
test('photo and voice backup preserves the full memory',()=>{const memory=example();assert.deepEqual(validateBackup(JSON.parse(JSON.stringify({version:1,memories:[memory]}))),[memory]);});
test('rejects invalid backups without partial import',()=>{for(const doc of [null,{}, {version:2,memories:[]},{version:1,memories:[example(),{...example(),state:'Invalid'}]},{version:1,memories:[{...example(),audio:'https://example.com/track'}]},{version:1,memories:[{...example(),photos:[{id:'x',name:'x',caption:'',data:'data:image/svg+xml;base64,YQ=='}]}]}])assert.throws(()=>validateBackup(doc));});
test('duplicate memory ids cannot silently overwrite restored data',()=>{const memory=example();assert.throws(()=>validateBackup({version:1,memories:[memory,memory]}));});
test('all 17 visited destinations are available, including home and international trips',()=>{assert.equal(visited.length,17);assert.equal(new Set(visited).size,17);for(const state of visited)assert.equal(validateBackup({version:1,memories:[{...example(),state}]}).length,1);assert.equal(destinationLabel('Texas'),'Texas · home');assert.equal(destinationLabel('Arizona'),'Arizona · Phoenix');});
