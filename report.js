(function(root){
  'use strict';
  const C=root.DiscoLabCore;
  const titles=['Inspeccionar el equipo','Interpretar MBR y GPT','Organizar el disco','Elegir formatos','Resolver incidencias','Preguntas finales'];
  async function build(state){
    const {PDFDocument,StandardFonts,rgb}=root.PDFLib;
    const doc=await PDFDocument.create(),regular=await doc.embedFont(StandardFonts.Courier),bold=await doc.embedFont(StandardFonts.CourierBold);
    const W=595.28,H=841.89,L=42,R=42,WIDTH=W-L-R,BOTTOM=H-55;
    const ink=rgb(.09,.16,.25),muted=rgb(.33,.40,.48),teal=rgb(0,.43,.46),blue=rgb(.15,.34,.63),line=rgb(.84,.88,.92),pale=rgb(.95,.97,.99);
    let page,y;const c=C.config(state.caseId),done=C.completion(state);
    doc.setTitle('DiscoLab - '+c.id+' - Informe de '+state.names);doc.setAuthor(state.names||'Alumnado');doc.setSubject('Práctica de Digitalización: discos, particiones y sistemas de archivos');doc.setCreator('DiscoLab 3.0');
    const readable=val=>String(val??'').replace(/\t/g,'  ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[\u2011\u2013]/g,'-').replace(/\u2713/g,'OK').replace(/\u2192/g,'->');
    function safeText(value){let out='';for(const ch of readable(value)){if(ch==='\n'||ch==='\r'){out+=ch;continue;}try{regular.encodeText(ch);out+=ch;}catch(e){out+='[U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')+']';}}return out;}
    function newPage(){page=doc.addPage([W,H]);y=76;page.drawRectangle({x:0,y:H-54,width:W,height:54,color:rgb(.07,.14,.25)});page.drawText('DiscoLab',{x:L,y:H-35,size:17,font:bold,color:rgb(1,1,1)});page.drawText('Digitalización - 4.º ESO',{x:W-R-225,y:H-32,size:9,font:regular,color:rgb(.76,.86,.93)});}
    function ensure(height){if(y+height>BOTTOM)newPage();}
    function text(value,x,top,fontSize=10,font=regular,color=ink){page.drawText(safeText(value),{x,y:H-top-fontSize,size:fontSize,font,color});}
    function wrap(value,width,fontSize=10,font=regular){
      const output=[];
      for(const paragraph of safeText(value).replace(/\r/g,'').split('\n')){
        if(!paragraph){output.push('');continue;}
        let current='';
        for(const word of paragraph.split(/ +/)){
          const joined=current?current+' '+word:word;
          if(font.widthOfTextAtSize(joined,fontSize)<=width){current=joined;continue;}
          if(current){output.push(current);current='';}
          if(font.widthOfTextAtSize(word,fontSize)<=width){current=word;continue;}
          let bit='';for(const ch of word){if(bit&&font.widthOfTextAtSize(bit+ch,fontSize)>width){output.push(bit);bit='';}bit+=ch;}current=bit;
        }
        if(current)output.push(current);
      }
      return output;
    }
    function paragraph(value,{size=10,font=regular,color=ink,indent=0,after=8}={}){const rows=wrap(value,WIDTH-indent,size,font);for(const row of rows){ensure(size*1.5);text(row,L+indent,y,size,font,color);y+=size*1.45;}y+=after;}
    function heading(value,level=1){ensure(level===1?135:85);y+=level===1?12:5;paragraph(value,{size:level===1?15:11.5,font:bold,color:level===1?teal:ink,after:9});}
    function rule(){ensure(15);page.drawLine({start:{x:L,y:H-y},end:{x:W-R,y:H-y},thickness:.7,color:line});y+=12;}
    function table(headers,rows,widths){
      const sizes=widths.map(w=>w*WIDTH),fontSize=8.5;
      function drawRow(cells,header=false){const lines=cells.map((cell,i)=>wrap(cell,sizes[i]-12,fontSize,header?bold:regular)),height=Math.max(23,Math.max(...lines.map(x=>x.length))*12+10);ensure(height+2);page.drawRectangle({x:L,y:H-y-height,width:WIDTH,height,color:header?rgb(.9,.95,.96):rgb(1,1,1),borderColor:line,borderWidth:.45});let x=L;lines.forEach((list,i)=>{list.forEach((s,j)=>text(s,x+6,y+5+j*12,fontSize,header?bold:regular));x+=sizes[i];});y+=height;}
      drawRow(headers,true);
      for(const row of rows){const rowHeight=Math.max(23,Math.max(...row.map((cell,i)=>wrap(cell,sizes[i]-12,fontSize).length))*12+10);if(y+rowHeight+2>BOTTOM){newPage();drawRow(headers,true);}drawRow(row);}
      y+=10;
    }
    function diskSection(disks,includeFiles=true){
      for(const d of disks){heading('Disco '+d.number+' - '+d.name+' | '+C.size(d.mib)+' | '+d.scheme,2);ensure(35);let x=L;for(const p of d.parts){const width=p.mib/d.mib*WIDTH;page.drawRectangle({x,y:H-y-13,width:Math.max(.1,width),height:13,color:p.type==='unallocated'?rgb(.15,.15,.15):p.type==='reserved'?rgb(.46,.53,.62):blue});x+=width;}y+=24;
        table(['Partición / zona','Letra','Tamaño','Formato','Archivos'],d.parts.map(p=>[p.label||'Sin asignar',p.letter?p.letter+':':'-',C.size(p.mib),p.fs||'-',d.failed?'Inaccesible':p.type==='unallocated'?'No corresponde':p.type==='reserved'?'Reservada':p.protected?'Sistema':String((p.files||[]).length)]),[.32,.08,.16,.14,.30]);
        if(d.failed)paragraph('Dispositivo averiado: sus volúmenes y archivos no están accesibles. Las particiones muestran su distribución anterior.',{size:9,color:muted});
        if(includeFiles&&!d.failed)for(const p of d.parts)if((p.files||[]).length){paragraph('Archivos de '+p.label+':',{size:9,font:bold,after:4});for(const f of p.files)paragraph('- '+f.name+' ('+C.size(f.mib)+')',{size:9,indent:10,after:2});y+=5;}
      }
    }
    newPage();
    paragraph('Informe de la práctica',{size:23,font:bold,after:15});
    paragraph('Alumnado: '+(state.names.trim()||'Sin indicar'),{size:12,font:bold});paragraph('Grupo / clase: '+(state.group.trim()||'Sin indicar'));
    paragraph('Modelo asignado: '+c.id,{size:12,font:bold,color:teal});
    paragraph('Fabricante de la placa base: '+c.motherboard);paragraph('Generado: '+new Date().toLocaleString('es-ES',{timeZone:'Europe/Madrid'}));
    paragraph('Estado: '+(done.every(Boolean)?'Respuestas y operaciones registradas':'En curso - quedan campos u operaciones por registrar'),{font:bold,color:teal});
    paragraph('El estado indica la presencia de respuestas y operaciones, sin evaluar su contenido. El profesor revisa las decisiones y explicaciones. Generar este informe no borra el progreso.',{size:9,color:muted});
    table(['Actividad','Estado'],titles.map((t,i)=>[t,done[i]?'Registrado':'En curso']),[.68,.32]);
    heading('Reparto solicitado');paragraph('Conservar los archivos de '+c.original+', hacer copia en el disco externo y reorganizar el volumen de '+c.total+' GB.');
    table(['Zona final solicitada','Tamaño','Estado'],[[c.original,c.keep+' GB','NTFS'],[c.target,c.project+' GB','NTFS'],['Reserva futura',c.reserve+' GB','Sin asignar']],[.4,.24,.36]);
    paragraph('La práctica usa discos virtuales. No se realizan modificaciones en el ordenador real.',{size:9,color:muted});
    heading('1. Inspección del equipo');
    table(['Consulta','Respuesta del alumnado'],[
      ['Firmware / modo',state.answers.firmware||'Sin responder'],['Discos físicos',state.answers.physical||'Sin responder'],['Particiones totales',state.answers.partitions||'Sin responder'],['Disco del sistema',state.answers.system!==undefined&&state.answers.system!==''?'Disco '+state.answers.system:'Sin responder'],['Esquema del disco de datos',state.answers.scheme||'Sin responder'],['Formato de Windows',state.answers.windowsFs||'Sin responder']
    ],[.48,.52]);
    paragraph('Explicación sobre particiones sin letra:',{font:bold});paragraph(state.answers.noLetter||'Sin responder.');
    heading('Estado inicial de los discos');diskSection(state.initialDisks);
    heading('2. Interpretación de MBR y GPT');
    paragraph('Ejemplo A: cuatro primarias MBR. Ejemplo C: '+c.gptPartitions+' particiones GPT. El disco grande tiene '+c.largeTB+' TB y sectores lógicos de 512 bytes.',{size:9,color:muted});
    paragraph('El ejemplo B del caso incluye tres primarias y una extendida con '+c.logical+' unidades lógicas.',{size:9,color:muted});
    table(['Pregunta','Respuesta'],[['Unidades de datos del ejemplo A',state.answers.primaryUnits||'Sin responder'],['¿Se puede añadir una quinta primaria en A?',state.answers.primaryAdd||'Sin responder'],['Entradas MBR usadas por el ejemplo B',state.answers.mbrEntries||'Sin responder'],['Unidades de datos del ejemplo B',state.answers.logicalUnits||'Sin responder'],['Particiones de datos del ejemplo C',state.answers.gptUnits||'Sin responder'],['¿Necesita extendida el ejemplo C?',state.answers.needsExtended||'Sin responder'],['Esquema para '+c.gptPartitions+' particiones sin extendida',state.answers.six||'Sin responder'],['Esquema para '+c.largeTB+' TB, sectores de 512 bytes',state.answers.large||'Sin responder']],[.68,.32]);
    paragraph('Justificación:',{font:bold});paragraph(state.answers.schemeWhy||'Sin responder.');
    heading('3A. Organización del disco - ejemplo guiado');
    paragraph('El estado de los discos y el historial documentan el reparto realizado y cómo se han conservado los archivos.');
    heading('Estado final de los discos');diskSection(state.disks);
    heading('3B. Organización del disco - trabajo autónomo');
    const challenge=C.challengeConfig(state);
    table(['Zona final solicitada','Tamaño','Requisitos'],[[challenge.original,challenge.keep+' GB','NTFS, conservar los tres archivos'],[challenge.localLabel,challenge.local+' GB','NTFS, copia de los tres archivos'],[challenge.sharedLabel,challenge.shared+' GB','exFAT, copia de los tres archivos'],['Reserva futura',challenge.reserve+' GB','Sin asignar']],[.32,.18,.50]);
    paragraph('Además, se solicita una copia comprobada de los tres archivos en el disco externo. Los dos ejercicios conservan discos y operaciones por separado.',{size:9});
    heading('Estado inicial del ejercicio autónomo');diskSection(state.challenge.initialDisks);
    heading('Estado final del ejercicio autónomo');diskSection(state.challenge.disks);
    heading('4. Pruebas de sistemas de archivos');
    for(const item of C.formatCases(state)){
      const t=state.formatTests[item.id]||{};heading(item.title,2);paragraph(item.prompt,{size:9,color:muted});
      paragraph('Elección: '+(t.choice||'Sin elegir')+' | Prueba: '+(t.testedAt?'realizada':'sin realizar'),{font:bold,size:10});
      paragraph('Justificación del alumnado: '+(t.why||'Sin responder.'));paragraph('Resultado de la prueba: '+(t.message||'No se ha realizado la prueba.'),{size:9,color:muted});rule();
    }
    heading('5. Incidencias');
    for(const item of C.incidentCases(state)){
      const t=state.incidentTests[item.id]||{},plan=item.plans.find(p=>p.id===(t.plan||t.selectedPlan));heading(item.title,2);paragraph(item.prompt,{size:9,color:muted});
      if(t.submittedWhy||t.why)paragraph('Explicación inicial conservada de una versión anterior: '+(t.submittedWhy||t.why));
      paragraph('Alternativa '+(plan?String.fromCharCode(65+item.plans.indexOf(plan)):'sin elegir')+' | Plan '+(t.active?'ejecutado':'seleccionado')+': '+(plan?plan.text:'Sin seleccionar.'));
      heading('Configuración inicial de la incidencia',2);diskSection(item.disks);
      paragraph('Resultado: '+(t.message||'Sin realizar.'),{size:9,color:ink});
      if(t.after){heading('Configuración después del plan ejecutado',2);diskSection(t.after);}
      paragraph('Reflexión posterior: '+(t.reflection||'Sin responder.'));
    }
    heading('6. Cuestionario final');
    for(const [i,q] of C.quizQuestions(state).entries()){
      const answer=q.options.find(o=>o.id===state.quizAnswers[q.id]);
      const estimate=70+wrap(q.text,WIDTH,10,bold).length*14.5+q.options.reduce((n,o)=>n+wrap(o.id.toUpperCase()+'. '+o.text,WIDTH-10,9).length*13.05+3,0)+wrap('Respuesta del alumnado: '+(answer?answer.id.toUpperCase()+'. '+answer.text:'Sin responder.'),WIDTH,10,bold).length*14.5;
      ensure(estimate);
      heading('Test '+(i+1),2);paragraph(q.text,{font:bold,size:10});
      for(const o of q.options)paragraph(o.id.toUpperCase()+'. '+o.text,{size:9,indent:10,after:3});
      const selected=q.options.find(o=>o.id===state.quizAnswers[q.id]);
      paragraph('Respuesta del alumnado: '+(selected?selected.id.toUpperCase()+'. '+selected.text:'Sin responder.'),{font:bold,size:10});
    }
    heading('Una pregunta de redacción');
    for(const [i,q] of C.finalQuestions(state).entries()){heading('Redacción '+(i+1),2);paragraph(q.text,{font:bold,size:10});paragraph(state.finalAnswers[q.id]||'Sin responder.');rule();}
    if(state.legacyFinalAnswers&&Object.keys(state.legacyFinalAnswers).length){
      heading('Respuestas conservadas de la versión anterior');
      const labels={firmware:'Firmware',inventory:'Discos y particiones',levels:'GPT y NTFS','partition-format':'Crear y formatear',fat:'Límite de FAT32',space:'Espacio libre y sin asignar',backup:'Copia de seguridad',safety:'Seguridad',process:'Proceso de organización',reflection:'Reflexión de la versión anterior'};
      for(const [id,answer] of Object.entries(state.legacyFinalAnswers)){heading(labels[id]||id,2);paragraph(answer||'Sin responder.');}
    }
    const hints=Object.entries(state.hints||{}).filter(([,v])=>v>0);
    if(hints.length){heading('Consultas conservadas de una versión anterior');for(const [n,level] of hints)paragraph('Actividad '+n+': nivel '+level+' de pista consultado en la versión anterior.');}
    heading('7. Registro completo de operaciones');
    paragraph('Incluye consultas, reinicios de actividad, intentos de operaciones detenidos y cambios realizados. Las incidencias conservan las decisiones ejecutadas y sus pasos.',{size:9,color:muted});
    if(!state.operations.length)paragraph('Sin operaciones registradas.');
    for(const [i,o] of state.operations.entries()){
      ensure(55);paragraph((i+1)+'. '+new Date(o.at).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})+' | Actividad '+o.stage+(o.stage===3?(o.area==='independent'?'B':'A'):'')+' | '+(o.status==='error'?'Intento detenido':o.status==='info'?'Consulta':'Realizado'),{font:bold,size:9,after:4});paragraph(o.message,{size:9,after:4});
      if(o.details.files&&o.details.files.length)paragraph('Archivos: '+o.details.files.join(', '),{size:8.5,indent:10,after:4});
      if(o.details.lostFiles&&o.details.lostFiles.length)paragraph('Archivos que dejan de estar disponibles: '+o.details.lostFiles.join(', '),{size:8.5,indent:10,after:4});
      if(o.details.steps)for(const [j,step] of o.details.steps.entries())paragraph('Paso '+(j+1)+': '+step.message,{size:8.5,indent:10,after:3});
      if(o.type==='incident'&&o.details.message)paragraph('Resultado del ensayo: '+o.details.message,{size:8.5,indent:10,after:4});
      y+=7;
    }
    const pages=doc.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:L,y:39},end:{x:W-R,y:39},color:line,thickness:.6});p.drawText('DiscoLab - '+c.id+' - Informe del alumnado',{x:L,y:25,size:8,font:regular,color:muted});const count=(i+1)+' / '+pages.length;p.drawText(count,{x:W-R-regular.widthOfTextAtSize(count,8),y:25,size:8,font:regular,color:muted});});
    return {bytes:await doc.save(),pageCount:pages.length};
  }
  async function download(state){const {bytes}=await build(C.clone(state));const blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');const names=state.names.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,55)||'alumnado';a.href=url;a.download='DiscoLab_Informe_'+state.caseId+'_'+names+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
  root.DiscoLabReport={build,download};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DiscoLabReport;
})(typeof window!=='undefined'?window:globalThis);
