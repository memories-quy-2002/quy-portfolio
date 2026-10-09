import { defineConfig } from 'vite';
export default defineConfig({
 server:{host:'0.0.0.0',allowedHosts:['terminal.local']},
 plugins:[{
  name:'responsive-review',
  configureServer(server){
   server.middlewares.use('/__review',(req,res)=>{
    const query=new URL(req.url,'http://terminal.local').searchParams;
    const width=[320,390,768,1440].includes(Number(query.get('width')))?Number(query.get('width')):390;
    const route=query.get('route')||'/';
    const safeRoute=/^\/[a-z0-9\-/]*$/.test(route)?route:'/';
    res.setHeader('Content-Type','text/html');
    res.end(`<!doctype html><html><head><title>Responsive review</title><style>html,body{margin:0;background:#0b1422}iframe{display:block;border:0;width:${width}px;height:900px}</style></head><body><iframe title="Portfolio at ${width}px" src="${safeRoute}"></iframe></body></html>`);
   });
  }
 }]
});
