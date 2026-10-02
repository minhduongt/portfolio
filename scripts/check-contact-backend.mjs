import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function load(file,dependencies){const module={exports:{}};vm.runInNewContext(readFileSync('../portfolio-be/src/'+file,'utf8'),{module,exports:module.exports,require:name=>{if(!(name in dependencies))throw Error('Unexpected dependency '+name);return dependencies[name]},process:{env:{}},console:{log(){}},Date});return module.exports}
const fail=async()=>{throw Error('fixture delivery failure')};
const email=load('services/emailServices.js',{nodemailer:{createTransport:()=>({sendMail:fail})}});
await assert.rejects(email.sendEmail({name:'Test',email:'test@example.com',message:'Hello'}),/fixture delivery failure/);
const contact=load('services/contactServices.js',{'../config/firebaseConfig':{contactsRef:{doc:()=>({set:fail})}},'firebase-admin/firestore':{FieldValue:{}}});
await assert.rejects(contact.createContact({name:'Test',message:'Hello'}),/fixture delivery failure/);
let mail;
const safe=load('services/emailServices.js',{nodemailer:{createTransport:()=>({sendMail:async value=>{mail=value}})}});
await safe.sendEmail({name:'<img src=x>',email:'test@example.com',message:'<a href="bad">hello</a>'});
assert(!mail.html.includes('<img'));assert(mail.html.includes('&lt;img'));
console.log('PASS: backend email/storage failures propagate and visitor text is escaped.');
