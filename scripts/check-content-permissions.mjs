import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../portfolio-be/package.json',import.meta.url));
const express=require('express'),request=require('supertest');
const {createFakeFirestore}=require('./test/helpers/fakeFirestore');
const {createContentService}=require('./src/services/contentService');
const {createContentController}=require('./src/controllers/contentController');
const {createApiRouter}=require('./src/routes/apis');
const {createAuthenticate}=require('./src/middlewares/authenticate');
const {createRequireAdmin}=require('./src/middlewares/requireAdmin');
const {validateBlogInput,validateToolInput}=require('./src/services/contentValidation');
for(const validate of [validateBlogInput,validateToolInput])assert.equal(validate({visibility:'limited'},{partial:true}).visibility,'limited');
const fake=createFakeFirestore({});const getUser=async uid=>({role:uid==='admin'||uid==='unverified'?'admin':'user'});
const verifyIdToken=async token=>{if(!['reader','admin','unverified'].includes(token))throw Object.assign(Error('Invalid'),{code:'auth/invalid-id-token'});return {uid:token,email_verified:token!=='unverified'}};
const noop=(_req,res)=>res.json({success:true});const controllers={emailController:{sendEmail:noop,sendCustomEmail:noop},imageController:{uploadImage:noop}};
for(const [resource,kind] of [['blogs','blog'],['tools','tool']]){
 for(const visibility of ['public','limited','private'])fake.documents.set(`${resource}/${visibility}`,{slug:visibility,visibility,archivedAt:null,title:visibility,name:visibility,component:'json-formatter'});
 fake.documents.set(`${resource}/archived`,{slug:'archived',visibility:'limited',archivedAt:1});
 controllers[`${kind}Controller`]=createContentController({service:createContentService({collectionRef:fake.db.collection(resource),kind,fieldValue:fake.fieldValue}),getUser});
}
const app=express();app.use(express.json());app.use('/api/v1',createApiRouter({controllers,authenticate:createAuthenticate({verifyIdToken}),optionalAuthenticate:createAuthenticate({verifyIdToken,optional:true}),requireAdmin:createRequireAdmin({getUser})}));app.use(require('./src/middlewares/error'));
const call=(method,path,token,body)=>{let result=request(app)[method]('/api/v1'+path);if(token)result=result.set('Authorization','Bearer '+token);return body?result.send(body):result};
for(const resource of ['blogs','tools']){
 for(const [token,allowed] of [[null,['public']],['reader',['limited','public']],['unverified',['limited','public']],['admin',['limited','private','public']]]){
  const result=await call('get','/'+resource,token);assert.equal(result.status,200);assert.deepEqual(result.body.data.map(item=>item.slug).sort(),allowed);
  for(const visibility of ['public','limited','private','archived'])assert.equal((await call('get',`/${resource}/${visibility}`,token)).status,allowed.includes(visibility)||token==='admin'?200:404,`${resource}/${visibility} as ${token}`);
  assert.equal((await call('get',`/${resource}?includeArchived=true`,token)).status,token==='admin'?200:403);
 }
 assert.equal((await call('get','/'+resource,'bad-token')).status,401);
 assert.equal((await call('get',`/${resource}/limited?isAuthenticated=true`)).status,404);
 assert.equal((await call('patch',`/${resource}/public`,'reader',{visibility:'limited'})).status,403);
 assert.equal((await call('patch',`/${resource}/public`,'admin',{visibility:'limited'})).status,200);
 const body=resource==='blogs'?{slug:'created',title:'Created',contentHtml:'<p>Only members</p>',visibility:'limited'}:{slug:'created',name:'Created',description:'Only members',component:'json-formatter',visibility:'limited'};
 assert.equal((await call('post','/'+resource,'admin',body)).status,201);
 assert.equal((await call('get',`/${resource}/created`)).status,404);assert.equal((await call('get',`/${resource}/created`,'reader')).status,200);
}
console.log('PASS: blogs/tools public, limited and private permission matrix; lists, direct links, archived content, invalid tokens, spoofing, admin create/update and reader write denial.');
