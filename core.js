(function (root) {
  'use strict';
  const G = 1024, MIB = 1048576, VERSION = 3;
  const CASES = [
    { id:'DL-01', title:'Taller audiovisual', total:512, project:160, reserve:64, original:'Materiales', target:'Proyectos', letter:'D', movie:6, logical:2, issue:'middle' },
    { id:'DL-02', title:'Radio escolar', total:640, project:200, reserve:80, original:'Grabaciones', target:'Edición', letter:'E', movie:8, logical:3, issue:'other' },
    { id:'DL-03', title:'Revista digital', total:768, project:240, reserve:96, original:'Documentos', target:'Maquetación', letter:'H', movie:10, logical:2, issue:'middle' },
    { id:'DL-04', title:'Archivo fotográfico', total:512, project:160, reserve:64, original:'Imágenes', target:'Selección', letter:'J', movie:7, logical:3, issue:'other' },
    { id:'DL-05', title:'Vídeos de ciencias', total:1024, project:320, reserve:128, original:'Recursos', target:'Montaje', letter:'D', movie:12, logical:2, issue:'middle' },
    { id:'DL-06', title:'Biblioteca digital', total:640, project:200, reserve:80, original:'Catálogo', target:'Publicaciones', letter:'E', movie:9, logical:3, issue:'other' },
    { id:'DL-07', title:'Portfolio del aula', total:768, project:240, reserve:96, original:'Trabajos', target:'Portfolio', letter:'H', movie:11, logical:2, issue:'middle' },
    { id:'DL-08', title:'Laboratorio de datos', total:1024, project:320, reserve:128, original:'Resultados', target:'Análisis', letter:'J', movie:6, logical:3, issue:'other' },
    { id:'DL-09', title:'Archivo sonoro', total:384, project:112, reserve:48, original:'Audios', target:'Sonido', letter:'D', movie:9, logical:4, issue:'middle' },
    { id:'DL-10', title:'Boletín científico', total:512, project:176, reserve:80, original:'Notas', target:'Publicación', letter:'E', movie:7, logical:2, issue:'other' },
    { id:'DL-11', title:'Atlas del barrio', total:640, project:224, reserve:112, original:'Mapas', target:'Cartografía', letter:'H', movie:13, logical:3, issue:'middle' },
    { id:'DL-12', title:'Observatorio meteorológico', total:768, project:272, reserve:128, original:'Series', target:'Estadística', letter:'J', movie:8, logical:4, issue:'other' },
    { id:'DL-13', title:'Diseño de espacios', total:1024, project:352, reserve:160, original:'Diseños', target:'Bocetos', letter:'D', movie:14, logical:2, issue:'middle' },
    { id:'DL-14', title:'Cortometraje escolar', total:512, project:192, reserve:64, original:'Guiones', target:'Escenas', letter:'E', movie:10, logical:3, issue:'other' },
    { id:'DL-15', title:'Museo virtual', total:640, project:208, reserve:96, original:'Fichas', target:'Consulta', letter:'H', movie:12, logical:4, issue:'middle' },
    { id:'DL-16', title:'Sensores ambientales', total:768, project:288, reserve:112, original:'Mediciones', target:'Procesado', letter:'J', movie:11, logical:2, issue:'other' }
  ].map((c,i) => ({ ...c, keep:c.total-c.project-c.reserve,gptPartitions:6+i%3,largeTB:[4,6,8][i%3],
    motherboard:['ASUS','MSI','GIGABYTE','ASRock'][i%4],
    systemBrand:['Samsung','Kingston','Crucial','Western Digital'][i%4],
    dataBrand:['Crucial','Western Digital','Samsung','Kingston'][i%4],
    backupBrand:['Seagate','Toshiba','Western Digital','Samsung'][i%4],
    usbBrand:['Kingston','SanDisk'][i%2]
  }));
  const clone = value => JSON.parse(JSON.stringify(value));
  const fmt = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n);
  const size = mib => mib >= G ? fmt(mib/G)+' GB' : fmt(mib)+' MB';
  const textNorm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const config = id => CASES.find(c => c.id === id) || CASES[0];
  const used = p => (p.files||[]).reduce((v,f) => v+f.mib,0)+(p.systemUsed||0);
  const volume = (id,label,letter,mib,fs='NTFS',files=[]) => ({id,type:'volume',label,letter,mib,fs,files:clone(files),minFloor:0});
  const free = (id,mib) => ({id,type:'unallocated',mib});
  const reserved = (id,label,mib,fs=null) => ({id,type:'reserved',label,letter:null,mib,fs,files:[],protected:true});
  function createState(id) {
    const c = config(id), k = CASES.indexOf(c)+1;
    const originals = [
      {id:'doc-'+c.id,name:'Plan_'+c.title.replace(/ /g,'_')+'.pdf',mib:12+k},
      {id:'img-'+c.id,name:'Imágenes_del_proyecto.zip',mib:350+20*k},
      {id:'data-'+c.id,name:'Registro_de_trabajo.xlsx',mib:4+k}
    ];
    const original = volume('original',c.original,c.letter,c.total*G,'NTFS',originals);
    original.minFloor = (c.keep-32)*G;
    const sys = volume('windows','Windows','C',256*G-260-16-1024,'NTFS');
    sys.protected=true;sys.systemUsed=55*G;
    const disks = [
      {id:'system',number:0,name:c.systemBrand+' · SSD del sistema',scheme:'GPT',mib:256*G,protected:true,sector:512,parts:[reserved('efi','Sistema EFI',260,'FAT32'),reserved('sys-msr','Reservada MSR',16),sys,reserved('recovery','Recuperación',1024,'NTFS')]},
      {id:'data',number:1,name:c.dataBrand+' · disco de datos',scheme:'GPT',mib:c.total*G+16,sector:512,parts:[reserved('data-msr','Reservada MSR',16),original]},
      {id:'backup',number:2,name:c.backupBrand+' · disco externo',scheme:'GPT',mib:128*G+16,sector:512,parts:[reserved('backup-msr','Reservada MSR',16),volume('backup-volume','Copia externa','F',128*G,'NTFS')]},
      {id:'usb',number:3,name:c.usbBrand+' · memoria USB',scheme:'MBR',mib:32*G,sector:512,parts:[volume('usb-volume','Intercambio','G',32*G,'FAT32',[{id:'usb-note',name:'Indicaciones.txt',mib:1}])]}
    ];
    return { app:'DiscoLab',version:VERSION,caseId:c.id,names:'',group:'',stage:0,tool:'disks',workArea:'guided',challenge:createChallenge(c),createdAt:new Date().toISOString(),savedAt:null,seq:0,disks,initialDisks:clone(disks),answers:{},quizAnswers:{},finalAnswers:{},formatTests:{},incidentTests:{},hints:{},activityEpochs:{},operations:[],feedback:{} };
  }
  function challengeConfig(state) {
    const c=config(typeof state==='string'?state:state.caseId),i=CASES.indexOf(c),k=i%4;
    const total=[384,512,640,768][k],local=[96,128,160,192][k],shared=[64,80,96,112][k],reserve=[32,48,64,80][k];
    return {total,local,shared,reserve,keep:total-local-shared-reserve,
      original:['Fuentes','Archivo fuente','Material bruto','Documentación'][k],
      localLabel:['Edición local','Trabajo local','Proyecto local','Análisis local'][k],
      sharedLabel:['Intercambio','Material compartido','Entrega compartida','Datos compartidos'][k]};
  }
  function createChallenge(c) {
    const q=challengeConfig(c.id),i=CASES.indexOf(c),files=[
      {id:'b-doc-'+c.id,name:'Memoria_del_proyecto.pdf',mib:18+i},
      {id:'b-media-'+c.id,name:'Material_multimedia.zip',mib:620+20*i},
      {id:'b-data-'+c.id,name:'Datos_originales.csv',mib:12+i}
    ];
    const original=volume('b-original',q.original,'U',q.total*G,'NTFS',files);
    original.minFloor=(q.keep-24)*G;
    const disks=[
      {id:'b-data',number:0,name:c.dataBrand+' · SSD de práctica',scheme:'GPT',mib:q.total*G+16,sector:512,parts:[reserved('b-msr','Reservada MSR',16),original]},
      {id:'b-backup',number:1,name:c.backupBrand+' · disco externo',scheme:'GPT',mib:128*G+16,sector:512,parts:[reserved('b-copy-msr','Reservada MSR',16),volume('b-safe','Copia externa','V',128*G,'NTFS')]}
    ];
    return {disks,initialDisks:clone(disks)};
  }
  function workState(state,area=state.workArea) {
    if(area!=='independent')return state;
    return {disks:state.challenge.disks,initialDisks:state.challenge.initialDisks,operations:state.operations,stage:3,area:'independent',
      get seq(){return state.seq;},set seq(value){state.seq=value;}};
  }
  function getPart(state,diskId,partId) {
    const disk=state.disks.find(d=>d.id===diskId),part=disk && disk.parts.find(p=>p.id===partId);
    if(!disk||!part) throw new Error('Selecciona una zona válida del disco.');
    return {disk,part,index:disk.parts.indexOf(part)};
  }
  function snapshot(state) { return state.disks.map(d=>({id:d.id,number:d.number,name:d.name,scheme:d.scheme,mib:d.mib,failed:!!d.failed,parts:clone(d.parts)})); }
  function record(state,type,message,status='ok',details={}) {
    const entry={id:++state.seq,at:new Date().toISOString(),stage:state.stage,type,status,message,details:clone(details)};
    if(state.stage===3)entry.area=state.area||state.workArea||'guided';
    state.operations.push(entry);return entry;
  }
  function freshId(state,prefix) { return prefix+'-'+(state.seq+1)+'-'+state.disks.reduce((n,d)=>n+d.parts.length,0); }
  function mergeFree(disk) {
    for(let i=disk.parts.length-2;i>=0;i--) if(disk.parts[i].type==='unallocated'&&disk.parts[i+1].type==='unallocated') {
      disk.parts[i].mib+=disk.parts[i+1].mib;disk.parts.splice(i+1,1);
    }
  }
  function writable(disk,part) {
    if(disk.failed)throw new Error('El dispositivo ha sufrido una avería: sus volúmenes no están accesibles.');
    if(disk.protected||part.protected||part.type==='reserved') throw new Error('Esta partición está protegida. En esta práctica se consulta, pero no se modifica.');
  }
  function capabilities(state,diskId,partId) {
    const {disk,part,index}=getPart(state,diskId,partId),locked=!!(disk.protected||part.protected||part.type==='reserved');
    const next=disk.parts[index+1];
    return {create:!locked&&part.type==='unallocated',format:!locked&&part.type==='volume',delete:!locked&&part.type==='volume',letter:!locked&&part.type==='volume',shrink:!locked&&part.type==='volume'&&['NTFS','RAW'].includes(part.fs)&&shrinkMax(part)>0,extend:!locked&&part.type==='volume'&&part.fs==='NTFS'&&!!next&&next.type==='unallocated',copy:!locked&&part.type==='volume'&&part.fs!=='RAW'&&(part.files||[]).length>0};
  }
  function shrinkMax(part) { return Math.max(0,Math.floor(part.mib-Math.max(used(part)+16,part.minFloor||0,16))); }
  function letters(state) { return state.disks.flatMap(d=>d.parts.map(p=>p.letter)).filter(Boolean); }
  function amount(n) { if(!Number.isSafeInteger(n)||n<1) throw new Error('Introduce un tamaño entero positivo en MB.'); return n; }
  function perform(state,action,args={}) {
    const before=snapshot(state);let result,description='';
    try {
      if(action==='copy') {
        const src=getPart(state,args.sourceDisk,args.sourcePart),dest=getPart(state,args.destDisk,args.destPart);
        writable(dest.disk,dest.part);
        if(src.disk.failed)throw new Error('El dispositivo de origen no está accesible.');
        if(src.part.type!=='volume'||dest.part.type!=='volume') throw new Error('La copia requiere un volumen de origen y otro de destino.');
        if(src.part.id===dest.part.id&&src.disk.id===dest.disk.id) throw new Error('Elige otro volumen como destino.');
        if(src.part.fs==='RAW') throw new Error('El volumen de origen no tiene un sistema de archivos utilizable.');
        if(dest.part.fs==='RAW') {
          record(state,'copy','Copia detenida: '+(dest.part.label||'volumen')+' no tiene sistema de archivos.','error',{...args,code:'RAW',before,after:before});
          return {ok:false,message:'El volumen de destino es RAW: está creado, pero todavía no está formateado. Los archivos no se han copiado.'};
        }
        const selected=(src.part.files||[]).filter(f=>!args.fileIds||args.fileIds.includes(f.id));
        if(!selected.length) throw new Error('No hay archivos para copiar.');
        if(dest.part.fs==='FAT32'&&selected.some(f=>f.mib*MIB>4294967295)) throw new Error('El archivo supera el límite de FAT32: 4 GB menos 1 byte por archivo. El espacio libre no resuelve esta limitación.');
        const added=selected.filter(f=>!(dest.part.files||[]).some(x=>x.id===f.id));
        if(used(dest.part)+added.reduce((n,f)=>n+f.mib,0)>dest.part.mib) throw new Error('No hay espacio suficiente en el volumen de destino.');
        dest.part.files.push(...clone(added));
        description='Copiados '+selected.length+' archivos de '+src.part.label+' ('+src.part.letter+':) a '+dest.part.label+' ('+dest.part.letter+':).';
        result={files:selected.map(f=>f.name),physicalBackup:src.disk.id!==dest.disk.id};
      } else {
        const {disk,part,index}=getPart(state,args.diskId,args.partId);writable(disk,part);
        if(action==='shrink') {
          if(!['NTFS','RAW'].includes(part.fs)||part.type!=='volume') throw new Error('Este gestor solo reduce volúmenes NTFS o sin formatear.');
          const n=amount(args.mib),max=shrinkMax(part);
          if(n>max) throw new Error('Solo se pueden reducir '+size(max)+'. El límite considera los datos y los archivos que no se pueden mover.');
          part.mib-=n;disk.parts.splice(index+1,0,free(freshId(state,'free'),n));mergeFree(disk);
          description='Reducido '+part.label+' en '+size(n)+'. Tamaño final: '+size(part.mib)+'. Los archivos se conservan.';
        } else if(action==='create') {
          if(part.type!=='unallocated') throw new Error('Crea el volumen dentro del espacio sin asignar.');
          const n=amount(args.mib);if(n>part.mib) throw new Error('El volumen supera el espacio sin asignar seleccionado.');
          if(disk.scheme==='MBR'&&disk.parts.filter(p=>p.type!=='unallocated').length>=4) throw new Error('La tabla MBR ya tiene cuatro entradas primarias ocupadas.');
          const letter=String(args.letter||'').toUpperCase();if(!/^[D-Z]$/.test(letter)||letters(state).includes(letter)) throw new Error('Selecciona una letra libre.');
          const label='Nuevo volumen',p=volume(freshId(state,'volume'),label,letter,n,'RAW');
          const items=[p];if(part.mib>n)items.push(free(freshId(state,'free-rem'),part.mib-n));disk.parts.splice(index,1,...items);
          description='Creado '+label+' ('+letter+':), '+size(n)+', sin formatear (RAW).';result={partId:p.id};
        } else if(action==='format') {
          if(part.type!=='volume') throw new Error('Selecciona un volumen.');
          if(!['NTFS','exFAT','FAT32'].includes(args.fs)) throw new Error('Este gestor de Windows no crea ext4 ni APFS.');
          if(args.fs==='FAT32'&&part.mib>32*G) throw new Error('La interfaz de Windows modelada no ofrece FAT32 para volúmenes mayores de 32 GB. No es el límite de tamaño de archivo de FAT32.');
          const lost=(part.files||[]).map(f=>f.name);part.fs=args.fs;part.label=String(args.label||part.label).trim().slice(0,32)||'Nuevo volumen';part.files=[];part.minFloor=0;
          description='Formateado '+part.label+' ('+part.letter+':) como '+args.fs+'. '+(lost.length?'Los '+lost.length+' archivos anteriores dejan de estar disponibles.':'El volumen estaba vacío.');
          result={lostFiles:lost,quick:args.quick!==false};
        } else if(action==='delete') {
          if(part.type!=='volume') throw new Error('Selecciona un volumen.');
          description='Eliminado el volumen '+part.label+' ('+part.letter+':), '+size(part.mib)+'. Su espacio queda sin asignar.';
          result={lostFiles:(part.files||[]).map(f=>f.name)};disk.parts.splice(index,1,free(freshId(state,'free'),part.mib));mergeFree(disk);
        } else if(action==='extend') {
          const next=disk.parts[index+1];
          if(part.fs!=='NTFS'||part.type!=='volume') throw new Error('Para esta operación, el volumen debe estar en NTFS.');
          if(!next||next.type!=='unallocated') throw new Error('El espacio sin asignar debe estar inmediatamente a la derecha y en el mismo disco.');
          const n=amount(args.mib);if(n>next.mib) throw new Error('El tamaño solicitado supera el espacio contiguo disponible.');
          part.mib+=n;next.mib-=n;if(!next.mib)disk.parts.splice(index+1,1);
          description='Ampliado '+part.label+' en '+size(n)+'. Tamaño final: '+size(part.mib)+'. Los archivos se conservan.';
        } else if(action==='letter') {
          if(part.type!=='volume') throw new Error('Selecciona un volumen.');
          const letter=String(args.letter||'').toUpperCase();if(!/^[D-Z]$/.test(letter)||letters(state).some(l=>l===letter&&l!==part.letter)) throw new Error('Selecciona una letra libre.');
          description='Cambiada la letra de '+part.label+': '+(part.letter||'sin letra')+' a '+letter+':.';part.letter=letter;
        } else throw new Error('Operación no reconocida.');
      }
      record(state,action,description,'ok',{...args,...result,before,after:snapshot(state)});
      return {ok:true,message:description,...result};
    } catch(error) {
      record(state,action,'Operación detenida: '+error.message,'error',{...args,before,after:snapshot(state)});
      return {ok:false,message:error.message};
    }
  }
  function formatCases(state) {
    const c=config(state.caseId),big=c.movie*G;
    return [
      {id:'exchange',title:'Intercambio entre Windows y macOS',device:c.usbBrand+' · USB de 32 GB',prompt:'Transporta un único vídeo de '+c.movie+' GB. Debe poder leerse y escribirse con las herramientas nativas de Windows y macOS.',best:'exFAT',file:big,platforms:['Windows','macOS'],reason:'exFAT admite el archivo grande y escritura nativa en ambos sistemas. FAT32 no admite ese archivo; macOS normalmente solo lee NTFS con sus herramientas nativas.'},
      {id:'legacy',title:'Reproductor Philips BDP5100/12',device:'Kingston · USB de 16 GB',prompt:'La ficha de USB del reproductor admite FAT16 y FAT32; entre las opciones de esta actividad corresponde FAT32. Los vídeos ocupan '+fmt((CASES.indexOf(c)%3+1)/2)+' GB cada uno. El formato y el códec del vídeo son compatibles con el aparato.',best:'FAT32',file:(CASES.indexOf(c)%3+1)*G/2,platforms:['Philips BDP5100/12'],reason:'La ficha del reproductor admite FAT16/FAT32. FAT32 está entre las opciones y cada archivo queda por debajo de su límite individual.'},
      {id:'windows',title:'Disco interno de Windows',device:c.dataBrand+' · disco interno',prompt:'Se requieren archivos grandes y permisos de acceso para usuarios distintos del equipo Windows.',best:'NTFS',file:big,platforms:['Windows'],reason:'NTFS ofrece permisos de acceso de Windows y admite archivos grandes. exFAT y FAT32 no ofrecen esos permisos.'},
      {id:'linux',title:'Volumen principal de Linux',device:c.dataBrand+' · disco interno',prompt:'Elige, entre estas opciones, un sistema de archivos nativo habitual de Linux con permisos Unix y registro de metadatos.',best:'ext4',file:big,platforms:['Linux'],reason:'ext4 es una opción nativa habitual de Linux con permisos Unix y registro. Linux también puede trabajar con otros sistemas de archivos; eso no los hace equivalentes para este encargo.'},
      {id:'mac',title:'SSD exclusivo para un Mac',device:'Samsung · SSD externo',prompt:'El equipo Apple usa macOS actual. Se buscan las funciones nativas de Apple, instantáneas y un sistema de archivos pensado para SSD.',best:'APFS',file:big,platforms:['macOS'],reason:'APFS es el sistema de archivos nativo moderno de Apple y ofrece las funciones solicitadas para ese SSD.'}
    ];
  }
  function filesystemFacts() {
    return [
      {id:'NTFS',use:'Windows: discos internos y unidades con permisos.',pros:'Archivos grandes, permisos de Windows y registro de cambios en metadatos.',cons:'macOS normalmente lo lee, pero no escribe con sus herramientas nativas. Algunos dispositivos no lo reconocen.'},
      {id:'ext4',use:'Linux: sistema y datos.',pros:'Permisos Unix, archivos grandes y registro de metadatos para facilitar la recuperación tras una interrupción.',cons:'Windows y macOS no lo utilizan de forma nativa para un intercambio normal. No es un formato universal para USB.'},
      {id:'FAT32',use:'USB y dispositivos que requieren amplia compatibilidad, especialmente antiguos.',pros:'Lo reconocen muchos sistemas, cámaras y reproductores.',cons:'Límite por archivo de 4 GB menos 1 byte en la escala que muestra este gestor (4.294.967.295 bytes). No ofrece permisos de usuario ni registro de cambios.'},
      {id:'exFAT',use:'USB, tarjetas y discos externos para intercambio.',pros:'Archivos de más de 4 GB y lectura y escritura nativas en Windows y macOS.',cons:'No ofrece los permisos ni el registro de metadatos de NTFS/ext4. Un aparato antiguo puede no reconocerlo.'},
      {id:'APFS',use:'macOS actual y otros sistemas de Apple, especialmente SSD.',pros:'Funciones de Apple como instantáneas, cifrado y uso compartido del espacio entre volúmenes de un contenedor.',cons:'Windows no lo utiliza de forma nativa. No es adecuado para un USB que deba escribirse tanto en Windows como en macOS.'}
    ];
  }
  function testFormat(state,id,choice) {
    const item=formatCases(state).find(i=>i.id===id);if(!item)throw new Error('Encargo desconocido.');
    if(!filesystemFacts().some(f=>f.id===choice))throw new Error('Selecciona un sistema de archivos.');
    let message='';const ok=choice===item.best;
    if(choice==='FAT32'&&item.file*MIB>4294967295)message='La copia se detiene: el archivo supera los 4.294.967.295 bytes que admite FAT32 por archivo. El espacio disponible en la unidad no cambia ese límite.';
    else if(item.id==='legacy')message=choice==='FAT32'?'El reproductor reconoce la unidad FAT32 y puede leer el vídeo de este tamaño.':'El reproductor no reconoce la unidad: entre las opciones de la actividad, su ficha admite FAT32.';
    else if(item.id==='exchange')message=choice==='exFAT'?'El vídeo se copia y la unidad permite lectura y escritura nativas en Windows y macOS.':choice==='NTFS'?'El vídeo se copia desde Windows. En macOS se puede leer, pero las herramientas nativas normalmente no permiten escribir en esta unidad.':'La unidad no ofrece lectura y escritura nativas en los dos sistemas de la ficha.';
    else if(item.id==='windows')message=choice==='NTFS'?'Se guarda el archivo grande y se pueden asignar permisos de acceso de Windows.':['FAT32','exFAT'].includes(choice)?'La unidad no ofrece permisos de acceso de Windows para usuarios distintos.':'El formato no se monta como una unidad de datos nativa de Windows.';
    else if(item.id==='linux')message=choice==='ext4'?'Linux monta el volumen ext4 con permisos Unix y registro de metadatos.':['FAT32','exFAT'].includes(choice)?'Linux puede utilizar este formato, pero no dispone en él de los permisos Unix y el registro de metadatos pedidos.':'El formato elegido no corresponde al sistema nativo habitual de Linux con las funciones indicadas en la ficha.';
    else message=choice==='APFS'?'macOS utiliza el SSD con las funciones nativas de APFS, incluidas las instantáneas.':choice==='exFAT'||choice==='FAT32'?'macOS puede utilizar este formato, pero no ofrece las instantáneas y las funciones de APFS solicitadas.':choice==='NTFS'?'macOS normalmente permite leer la unidad NTFS; no ofrece escritura nativa ni las funciones de APFS solicitadas.':'macOS no monta ext4 como un volumen de datos nativo.';
    const previous=state.formatTests[id]||{};
    state.formatTests[id]={...previous,choice,ok,message,testedAt:new Date().toISOString()};
    record(state,'format-test',item.title+': '+choice+'. '+message,'info',{id,choice});return {ok,message};
  }
  function shuffled(items,seed) {
    const result=items.slice();let n=seed>>>0;
    for(let i=result.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function incidentBank(state) {
    const c=config(state.caseId),n=CASES.indexOf(c),a=(100+n*10)*G,gap=(80+n*10)*G;
    const gpt=(id,number,name,parts)=>({id,number,name,scheme:'GPT',mib:parts.reduce((v,p)=>v+p.mib,16),sector:512,parts:[reserved(id+'-msr','Reservada MSR',16),...parts]});
    const mbr=(id,number,name,parts)=>({id,number,name,scheme:'MBR',mib:parts.reduce((v,p)=>v+p.mib,0),sector:512,parts});
    const principal=volume('i-main','Proyectos','P',a,'NTFS',[{id:'i-project',name:'Proyecto_final.zip',mib:2048}]);
    const between=volume('i-middle','Archivo','Q',gap,'NTFS',[{id:'i-archive',name:'Documentación.pdf',mib:20}]);
    const ext=gpt('i-copy',6,c.backupBrand+' · disco externo',[volume('i-safe','Copia','R',256*G,'NTFS')]);
    const first=c.issue==='middle'?
      [gpt('i-disk',4,c.dataBrand+' · disco de datos',[principal,between,free('i-free',gap)]),clone(ext)]:
      [gpt('i-disk',4,c.dataBrand+' · disco de datos',[principal,between]),gpt('i-extra',5,c.systemBrand+' · segundo disco',[free('i-free',gap)]),clone(ext)];
    const usb=mbr('i-usb',7,c.usbBrand+' · memoria USB',[volume('i-usb-volume','Intercambio','S',32*G,'FAT32',[{id:'i-note',name:'Notas_del_grupo.pdf',mib:10}])]);
    const extra=[16,24,32,40][n%4],remain=[24,32,40,48][n%4];
    const items=[
      {id:'extend',title:'«Extender volumen» no está disponible',prompt:'Proyectos necesita exactamente 40 GB adicionales en ese mismo volumen. Conserva su contenido y los archivos de Archivo. Consulta la posición del espacio disponible.',disks:first,plans:[
        {id:'backup-delete',text:'Copiar Archivo al disco externo, eliminar ese volumen, ampliar Proyectos 40 GB y recrear Archivo con el espacio restante. Formatearlo y restaurar sus archivos.',correct:true},
        {id:'shrink-middle',text:'Reducir Archivo en 40 GB y usar el espacio que aparezca para ampliar directamente Proyectos.'},
        {id:'format-middle',text:'Formatear Archivo y después intentar ampliar Proyectos en 40 GB.'},
        {id:'other-disk',text:'Añadir directamente al volumen básico Proyectos 40 GB de espacio disponible en otro disco.'}
      ]},
      {id:'large-file',title:'El vídeo no se copia al USB',prompt:'El vídeo ocupa '+c.movie+' GB. El USB tiene espacio suficiente, pero la copia falla. Debe usarse con lectura y escritura nativas en Windows y macOS y conservar Notas_del_grupo.pdf.',disks:[usb,clone(ext)],plans:[
        {id:'backup-exfat',text:'Guardar los archivos del USB en otro dispositivo, formatear el USB como exFAT, restaurar esos archivos y copiar el vídeo.',correct:true},
        {id:'delete-space',text:'Eliminar los archivos del USB para disponer de más espacio y volver a copiar el vídeo.'},
        {id:'quick-format',text:'Aplicar formato rápido exFAT sin copiar los archivos anteriores y copiar el vídeo.'},
        {id:'ntfs',text:'Formatear directamente como NTFS y copiar el vídeo; utilizar después el USB en los dos sistemas.'}
      ]},
      {id:'backup-risk',title:'Dos particiones, una misma avería',prompt:'Informe_del_proyecto.pdf está en Trabajo. Elige dónde preparar su copia. Después se simulará una avería total del disco físico 4: sus dos particiones serán inaccesibles. El documento debe seguir disponible en un dispositivo que funcione.',disks:[
        mbr('r-main',4,c.dataBrand+' · disco de datos',[volume('r-work','Trabajo','P',60*G,'NTFS',[{id:'r-doc',name:'Informe_del_proyecto.pdf',mib:25}]),volume('r-local','Copia interna','Q',60*G,'NTFS')]),
        mbr('r-external',5,c.backupBrand+' · disco externo',[volume('r-safe','Copia externa','R',80*G,'NTFS')])
      ],plans:[
        {id:'external',text:'Copiar y comprobar el documento en Copia externa, del disco físico 5.',correct:true},
        {id:'partition',text:'Copiar y comprobar el documento en Copia interna, de la segunda partición del disco 4.'},
        {id:'same-volume',text:'Duplicar el documento con otro nombre dentro de Trabajo, en el disco 4.'},
        {id:'label',text:'Cambiar la etiqueta de Trabajo a «Copia segura» y dejar allí el documento.'}
      ]},
      {id:'raw-data',title:'Una unidad con datos aparece como RAW',prompt:'Antes se podían abrir Fotos_del_proyecto.zip y Evaluación.pdf en este disco '+c.usbBrand+'. Ahora Windows muestra RAW y no permite consultar sus archivos. No hay otra copia. El objetivo es evitar nuevas escrituras que reduzcan las posibilidades de recuperación; no se exige reparar la unidad en esta práctica.',disks:[mbr('raw-disk',4,c.usbBrand+' · unidad externa',[volume('raw-volume','Archivo del proyecto','T',64*G,'RAW')])],plans:[
        {id:'preserve',text:'Detener las escrituras, conservar la unidad y solicitar ayuda para valorar la recuperación antes de modificarla.',correct:true},
        {id:'format',text:'Formatear la unidad como NTFS para que Windows pueda volver a utilizarla.'},
        {id:'recreate',text:'Eliminar el volumen, crear uno nuevo en la misma zona y formatearlo como NTFS.'},
        {id:'letter',text:'Cambiar la letra a D: y dar por recuperados los archivos sin investigar el problema.'}
      ]},
      {id:'adjacent',title:'Ampliar solo lo necesario',prompt:'Edición tiene 80 GB. Debe ganar exactamente '+extra+' GB y conservar Memoria.pdf. Después deben quedar '+remain+' GB sin asignar para otro uso. El espacio disponible ya está contiguo, a la derecha, en el mismo disco.',extra,reserve:remain,disks:[mbr('a-disk',4,c.dataBrand+' · disco de datos',[volume('a-main','Edición','P',80*G,'NTFS',[{id:'a-doc',name:'Memoria.pdf',mib:30}]),free('a-free',(extra+remain)*G)])],plans:[
        {id:'extend-needed',text:'Extender Edición añadiendo '+extra+' GB, sin formatear y dejando el resto sin asignar.',correct:true},
        {id:'format',text:'Formatear Edición como NTFS y mantener el espacio sin asignar.'},
        {id:'new-volume',text:'Crear otro volumen NTFS de '+extra+' GB a la derecha de Edición.'},
        {id:'extend-all',text:'Extender Edición utilizando los '+(extra+remain)+' GB sin asignar.'}
      ]},
      {id:'mbr-full',title:'Hay espacio, pero MBR ya tiene cuatro primarias',prompt:'El disco '+c.dataBrand+' tiene cuatro particiones primarias con un documento cada una y 40 GB sin asignar. Se necesita una quinta partición de datos de 20 GB, sin extendida, conservando las cuatro anteriores y sus documentos. El disco no contiene el sistema operativo. La conversión de Administración de discos solo se ofrece cuando no quedan volúmenes en el disco.',disks:[
        mbr('m-disk',4,c.dataBrand+' · disco de datos',[...['P','Q','S','T'].map((l,j)=>volume('m-v'+j,'Archivo '+(j+1),l,20*G,'NTFS',[{id:'m-doc'+j,name:'Documento_'+(j+1)+'.pdf',mib:12+j}])),free('m-free',40*G)]),clone(ext)
      ],plans:[
        {id:'backup-gpt',text:'Copiar los cuatro documentos al disco externo, eliminar los cuatro volúmenes, convertir el disco vacío a GPT, recrear y formatear sus cuatro volúmenes, restaurar los documentos y crear el quinto volumen de 20 GB.',correct:true},
        {id:'fifth',text:'Crear directamente una quinta primaria de 20 GB en el espacio sin asignar del MBR.'},
        {id:'format-one',text:'Formatear Archivo 4 y después intentar crear una quinta primaria sin cambiar el esquema.'},
        {id:'delete-one',text:'Eliminar Archivo 4 sin copiar su documento y crear un nuevo volumen de 20 GB con otra letra.'}
      ]},
      {id:'letter-path',title:'La letra cambió y una ruta ya no funciona',prompt:'Una aplicación busca D:\\RutaProyecto.pdf. El archivo está en el volumen Archivo, que ahora tiene la letra M:. D: está libre. Recupera esa ruta sin eliminar ni mover el documento. Es un volumen de datos, sin sistema operativo ni aplicaciones instaladas.',disks:[mbr('l-disk',4,c.dataBrand+' · disco de datos',[volume('l-main','Archivo','M',64*G,'NTFS',[{id:'l-doc',name:'RutaProyecto.pdf',mib:18}])])],plans:[
        {id:'change-letter',text:'Cambiar la letra de Archivo de M: a D: y mantener sus archivos.',correct:true},
        {id:'format-label',text:'Formatear Archivo como NTFS escribiendo D como etiqueta del volumen.'},
        {id:'rename',text:'Cambiar únicamente la etiqueta Archivo por D, conservando la letra M:.'},
        {id:'recreate',text:'Eliminar el volumen y crear y formatear otro con letra D: sin restaurar archivos.'}
      ]}
    ];
    return items.map((item,j)=>({...item,plans:shuffled(item.plans,(n+1)*8123+(j+1)*97)}));
  }
  function incidentCases(state) {
    const i=CASES.indexOf(config(state.caseId)),bank=incidentBank(state),pairs=[[2,3],[2,4],[2,5],[2,6],[3,4],[3,5],[3,6],[4,5],[4,6],[5,6]];
    const ids=[0,1,...pairs[i%pairs.length]];
    return shuffled(ids.map(j=>bank[j]),(i+1)*1399);
  }
  function testIncident(state,id,plan) {
    const scenario=incidentCases(state).find(i=>i.id===id),option=scenario&&scenario.plans.find(p=>p.id===plan);
    if(!option)return {ok:false,message:'Selecciona un plan de esta incidencia.'};
    const previous=state.incidentTests[id]||{};
    if(previous.active)return {ok:false,blocked:true,message:'El plan ya se ha ejecutado. Analiza sus consecuencias.'};
    const mini={disks:clone(scenario.disks),operations:[],seq:0,stage:5};let messages=[];
    const run=(action,args)=>{const r=perform(mini,action,args);messages.push(r.message);return r;};
    const note=(type,message,details={})=>{record(mini,type,message,'info',details);messages.push(message);};
    if(id==='extend') {
      if(plan==='backup-delete') {
        run('copy',{sourceDisk:'i-disk',sourcePart:'i-middle',destDisk:'i-copy',destPart:'i-safe'});
        const old=getPart(mini,'i-disk','i-middle').part,oldLabel=old.label,oldLetter=old.letter;
        run('delete',{diskId:'i-disk',partId:'i-middle'});run('extend',{diskId:'i-disk',partId:'i-main',mib:40*G});
        const gap=getPart(mini,'i-disk','i-main').disk.parts.find(p=>p.type==='unallocated');
        const created=run('create',{diskId:'i-disk',partId:gap.id,mib:gap.mib,letter:oldLetter});
        run('format',{diskId:'i-disk',partId:created.partId,fs:'NTFS',label:oldLabel});
        run('copy',{sourceDisk:'i-copy',sourcePart:'i-safe',destDisk:'i-disk',destPart:created.partId});
        messages.push('Proyectos gana 40 GB. Proyecto_final.zip y Documentación.pdf siguen disponibles, y también hay una copia externa de Documentación.pdf.');
      }else if(plan==='shrink-middle'){
        run('shrink',{diskId:'i-disk',partId:'i-middle',mib:40*G});run('extend',{diskId:'i-disk',partId:'i-main',mib:40*G});
        messages.push('Archivo continúa entre Proyectos y el espacio sin asignar. Los documentos se conservan, pero Proyectos no crece.');
      }else if(plan==='format-middle'){
        run('format',{diskId:'i-disk',partId:'i-middle',fs:'NTFS'});run('extend',{diskId:'i-disk',partId:'i-main',mib:40*G});
        messages.push('Archivo mantiene su partición y tamaño. Documentación.pdf deja de estar disponible y Proyectos no crece.');
      }else{
        run('extend',{diskId:'i-disk',partId:'i-main',mib:40*G});messages.push('No se añade espacio de otro disco a este volumen básico. Proyectos conserva su tamaño y los documentos se mantienen.');
      }
    }else if(id==='large-file'){
      const movie=()=>{getPart(mini,'i-usb','i-usb-volume').part.files.push({id:'i-movie',name:'Vídeo_del_proyecto.mp4',mib:config(state.caseId).movie*G});note('copy','Copiado el vídeo al USB.');};
      if(plan==='backup-exfat'){
        run('copy',{sourceDisk:'i-usb',sourcePart:'i-usb-volume',destDisk:'i-copy',destPart:'i-safe'});
        run('format',{diskId:'i-usb',partId:'i-usb-volume',fs:'exFAT'});
        run('copy',{sourceDisk:'i-copy',sourcePart:'i-safe',destDisk:'i-usb',destPart:'i-usb-volume'});movie();
        messages.push('El vídeo y Notas_del_grupo.pdf están disponibles. exFAT permite el archivo grande y escritura nativa en Windows y macOS.');
      }else if(plan==='delete-space'){
        const p=getPart(mini,'i-usb','i-usb-volume').part;p.files=[];
        note('delete-files','Eliminado Notas_del_grupo.pdf del USB.');note('copy','La copia del vídeo se detiene: el archivo supera el límite individual de FAT32.');
      }else{
        run('format',{diskId:'i-usb',partId:'i-usb-volume',fs:plan==='quick-format'?'exFAT':'NTFS'});movie();
        messages.push(plan==='quick-format'?'El vídeo se copia, pero Notas_del_grupo.pdf deja de estar disponible. El formato rápido no conserva el acceso normal a los archivos.':'El vídeo se copia desde Windows y Notas_del_grupo.pdf deja de estar disponible. macOS normalmente no escribe en NTFS con sus herramientas nativas.');
      }
    }else if(id==='backup-risk'){
      if(plan==='external')run('copy',{sourceDisk:'r-main',sourcePart:'r-work',destDisk:'r-external',destPart:'r-safe'});
      else if(plan==='partition')run('copy',{sourceDisk:'r-main',sourcePart:'r-work',destDisk:'r-main',destPart:'r-local'});
      else if(plan==='same-volume'){
        getPart(mini,'r-main','r-work').part.files.push({id:'r-duplicate',name:'Informe_copia.pdf',mib:25});note('copy','Duplicado el documento en el mismo volumen Trabajo.');
      }else{getPart(mini,'r-main','r-work').part.label='Copia segura';note('label','Cambiada la etiqueta del volumen, sin crear otra copia.');}
      mini.disks.find(d=>d.id==='r-main').failed=true;
      note('device-failure','Avería física simulada del disco 4: Trabajo y Copia interna dejan de estar accesibles.');
      messages.push(plan==='external'?'El documento se puede abrir desde el disco externo 5.':'No queda una copia accesible en el disco externo 5. Otra partición o carpeta del disco averiado depende del mismo dispositivo.');
    }else if(id==='raw-data'){
      if(plan==='preserve')note('preserve','No se escribe en la unidad. Sigue como RAW. Se conserva para valorar una recuperación; esta simulación no recupera los documentos ni garantiza que sea posible.');
      else if(plan==='format'){run('format',{diskId:'raw-disk',partId:'raw-volume',fs:'NTFS'});messages.push('Ahora hay un volumen NTFS vacío. Formatear no recupera los documentos anteriores y escribe una nueva estructura.');}
      else if(plan==='recreate'){
        run('delete',{diskId:'raw-disk',partId:'raw-volume'});const f=mini.disks[0].parts[0];
        const made=run('create',{diskId:'raw-disk',partId:f.id,mib:f.mib,letter:'T'});run('format',{diskId:'raw-disk',partId:made.partId,fs:'NTFS',label:'Archivo del proyecto'});
        messages.push('Se ha creado un volumen NTFS vacío en la misma zona. Los documentos anteriores no se han recuperado y se han modificado estructuras del disco.');
      }else{run('letter',{diskId:'raw-disk',partId:'raw-volume',letter:'D'});messages.push('La letra cambia, pero sigue RAW y los archivos no se pueden abrir. Cambiar la letra no repara el sistema de archivos; falta valorar la recuperación.');}
    }else if(id==='adjacent'){
      if(plan==='extend-needed')run('extend',{diskId:'a-disk',partId:'a-main',mib:scenario.extra*G});
      else if(plan==='extend-all')run('extend',{diskId:'a-disk',partId:'a-main',mib:(scenario.extra+scenario.reserve)*G});
      else if(plan==='format')run('format',{diskId:'a-disk',partId:'a-main',fs:'NTFS'});
      else{const made=run('create',{diskId:'a-disk',partId:'a-free',mib:scenario.extra*G,letter:'Q'});run('format',{diskId:'a-disk',partId:made.partId,fs:'NTFS',label:'Nuevo volumen'});}
      const main=getPart(mini,'a-disk','a-main').part,left=mini.disks[0].parts.filter(p=>p.type==='unallocated').reduce((v,p)=>v+p.mib,0);
      messages.push('Edición: '+size(main.mib)+'. Sin asignar: '+size(left)+'. Memoria.pdf: '+(main.files.length?'disponible.':'no disponible.'));
    }else if(id==='mbr-full'){
      const disk=mini.disks.find(d=>d.id==='m-disk');
      if(plan==='backup-gpt'){
        const previousVolumes=clone(disk.parts.filter(p=>p.type==='volume'));
        for(const p of previousVolumes)run('copy',{sourceDisk:'m-disk',sourcePart:p.id,destDisk:'i-copy',destPart:'i-safe'});
        for(const p of previousVolumes)run('delete',{diskId:'m-disk',partId:p.id});
        disk.scheme='GPT';disk.parts=[reserved('m-msr','Reservada MSR',16),free('m-new-free',disk.mib-16)];
        note('convert','Convertido el disco vacío de MBR a GPT. Windows reserva 16 MB como MSR.');
        for(const p of previousVolumes){
          const f=disk.parts.find(x=>x.type==='unallocated'),made=run('create',{diskId:'m-disk',partId:f.id,mib:p.mib,letter:p.letter});
          run('format',{diskId:'m-disk',partId:made.partId,fs:'NTFS',label:p.label});
          run('copy',{sourceDisk:'i-copy',sourcePart:'i-safe',destDisk:'m-disk',destPart:made.partId,fileIds:p.files.map(f=>f.id)});
        }
        const f=disk.parts.find(p=>p.type==='unallocated'),made=run('create',{diskId:'m-disk',partId:f.id,mib:20*G,letter:'D'});
        run('format',{diskId:'m-disk',partId:made.partId,fs:'NTFS',label:'Archivo 5'});
        messages.push('Hay cinco volúmenes de datos en GPT. Los cuatro documentos originales están restaurados y también copiados en el disco externo. Quedan '+size(disk.parts.find(p=>p.type==='unallocated').mib)+' sin asignar; la MSR ocupa 16 MB.');
      }else if(plan==='fifth')run('create',{diskId:'m-disk',partId:'m-free',mib:20*G,letter:'D'});
      else if(plan==='format-one'){run('format',{diskId:'m-disk',partId:'m-v3',fs:'NTFS'});run('create',{diskId:'m-disk',partId:'m-free',mib:20*G,letter:'D'});}
      else{
        run('delete',{diskId:'m-disk',partId:'m-v3'});const f=disk.parts.find(p=>p.type==='unallocated');
        const made=run('create',{diskId:'m-disk',partId:f.id,mib:20*G,letter:'D'});run('format',{diskId:'m-disk',partId:made.partId,fs:'NTFS',label:'Archivo 5'});
        messages.push('Siguen siendo cuatro primarias MBR. Archivo 4 y Documento_4.pdf no se han conservado.');
      }
    }else if(id==='letter-path'){
      if(plan==='change-letter')run('letter',{diskId:'l-disk',partId:'l-main',letter:'D'});
      else if(plan==='format-label')run('format',{diskId:'l-disk',partId:'l-main',fs:'NTFS',label:'D'});
      else if(plan==='rename'){getPart(mini,'l-disk','l-main').part.label='D';note('label','Cambiada la etiqueta a D; la letra sigue siendo M:.');}
      else{
        run('delete',{diskId:'l-disk',partId:'l-main'});const f=mini.disks[0].parts[0],made=run('create',{diskId:'l-disk',partId:f.id,mib:f.mib,letter:'D'});
        run('format',{diskId:'l-disk',partId:made.partId,fs:'NTFS',label:'Archivo'});
      }
      const p=mini.disks[0].parts.find(p=>p.type==='volume'),found=p.letter==='D'&&p.files.some(f=>f.id==='l-doc');
      messages.push(found?'La aplicación encuentra D:\\RutaProyecto.pdf y el archivo conserva su contenido.':'La aplicación no encuentra D:\\RutaProyecto.pdf. '+(p.files.length?'El documento sigue en M:, aunque la etiqueta haya cambiado.':'El volumen está vacío.'));
    }
    const ok=!!option.correct,after=snapshot(mini),message=messages.join('\n');
    state.incidentTests[id]={...previous,plan,selectedPlan:plan,ok,active:true,after,message,committedAt:new Date().toISOString(),reflection:''};
    record(state,'incident','Incidencia «'+scenario.title+'»: '+option.text,'info',{id,plan,before:scenario.disks,after,steps:mini.operations,message});
    return {ok,message};
  }
  function checks(state) {
    const c=config(state.caseId),a=state.answers;
    const inspect=[
      ['Firmware identificado',a.firmware==='UEFI'],['Número de discos físicos',a.physical==='4'],['Número de particiones (incluidas las reservadas)',a.partitions==='9'],['Disco del sistema',a.system==='0'],['Esquema del disco de datos',a.scheme==='GPT'],['Sistema de archivos de Windows',a.windowsFs==='NTFS'],['Explicación sobre las particiones sin letra',String(a.noLetter||'').trim().length>=20]
    ];
    const schemes=[['Entradas de la tabla MBR',a.mbrEntries==='4'],['Unidades de datos en el ejemplo MBR',a.logicalUnits===String(3+c.logical)],['Esquema para seis particiones primarias',a.six==='GPT'],['Esquema para el disco grande con sectores de 512 bytes',a.large==='GPT'],['Justificación del esquema elegido',String(a.schemeWhy||'').trim().length>=20]];
    const data=state.disks.find(d=>d.id==='data'),original=data.parts.find(p=>p.id==='original'),initial=state.initialDisks.find(d=>d.id==='data').parts.find(p=>p.id==='original');
    const target=data.parts.find(p=>p.type==='volume'&&p.id!=='original'&&textNorm(p.label)===textNorm(c.target));
    const hasFiles=(part,list)=>!!part&&list.every(f=>(part.files||[]).some(x=>x.id===f.id&&x.mib===f.mib));
    const backup=state.disks.find(d=>d.id==='backup').parts.find(p=>p.id==='backup-volume');
    const rawAttempt=!!target&&state.operations.some(o=>o.type==='copy'&&o.status==='error'&&o.details.code==='RAW'&&o.details.destPart===target.id);
    const goodCopy=!!target&&state.operations.some(o=>o.type==='copy'&&o.status==='ok'&&o.details.destPart===target.id);
    const backupBeforeShrink=state.operations.some((o,i)=>o.type==='copy'&&o.status==='ok'&&o.details.destDisk==='backup'&&o.details.sourcePart==='original'&&state.operations.slice(i+1).some(x=>x.type==='shrink'&&x.status==='ok'&&x.details.partId==='original'));
    const organize=[['Copia en otro disco antes de reducir',hasFiles(backup,initial.files)&&backupBeforeShrink],['Archivos originales conservados',hasFiles(original,initial.files)],['Volumen original: '+c.keep+' GB',!!original&&original.mib===c.keep*G],['Nuevo volumen '+c.target+': '+c.project+' GB, NTFS',!!target&&target.mib===c.project*G&&target.fs==='NTFS'],['Reserva sin asignar: '+c.reserve+' GB',data.parts.filter(p=>p.type==='unallocated').reduce((n,p)=>n+p.mib,0)===c.reserve*G],['Intento de copia antes de formatear',rawAttempt],['Copia comprobada después de formatear',goodCopy&&hasFiles(target,initial.files)]];
    const formats=formatCases(state).map(i=>{const t=state.formatTests[i.id]||{};return [i.title,!!t.ok&&t.choice===i.best&&String(t.why||'').trim().length>=20];});
    const incidents=incidentCases(state).map(i=>{const t=state.incidentTests[i.id]||{};return [i.title,!!t.ok&&String(t.reflection||'').trim().length>=20];});
    const finals=finalQuestions(state).map((q,i)=>['Pregunta '+(i+1),String(state.finalAnswers[q.id]||'').trim().length>=20]);
    return [inspect,schemes,organize,formats,incidents,finals];
  }
  function completion(state) {
    const a=state.answers,filled=v=>String(v||'').trim().length>0;
    const answered=keys=>keys.every(k=>filled(a[k]));
    const ops=state.operations.filter(o=>o.stage===3&&o.id>(state.activityEpochs?.[3]||0));
    const guided=ops.filter(o=>(o.area||'guided')==='guided'),independent=ops.filter(o=>o.area==='independent');
    const count=(list,type)=>list.filter(o=>o.type===type&&o.status==='ok').length;
    return [
      answered(['firmware','physical','partitions','system','scheme','windowsFs','noLetter']),
      answered(['primaryUnits','primaryAdd','mbrEntries','logicalUnits','gptUnits','needsExtended','six','large','schemeWhy']),
      ['copy','shrink','create','format'].every(type=>count(guided,type)>0)&&guided.some(o=>o.type==='copy'&&o.details.code==='RAW')&&count(independent,'copy')>=3&&count(independent,'shrink')>0&&count(independent,'create')>=2&&count(independent,'format')>=2,
      formatCases(state).every(i=>{const t=state.formatTests[i.id]||{};return filled(t.choice)&&filled(t.why)&&!!t.testedAt;}),
      incidentCases(state).every(i=>{const t=state.incidentTests[i.id]||{};return !!t.active&&filled(t.reflection);}),
      quizQuestions(state).every(q=>filled(state.quizAnswers?.[q.id]))&&finalQuestions(state).every(q=>filled(state.finalAnswers[q.id]))
    ];
  }
  function quizQuestions(state) {
    const c=config(state.caseId);
    const q=(id,text,choices,correct,explanation)=>({id,text,options:choices.map((text,i)=>({id:String.fromCharCode(97+i),text})),correct,explanation});
    return [
      q('firmware','¿Qué comienza a ejecutarse antes que el sistema operativo?',['El Explorador de archivos.','El firmware de la placa base.','Una carpeta del disco de datos.','El antivirus de Windows.'],'b','El firmware inicializa el hardware y localiza un cargador de arranque antes de que se ejecute el sistema operativo.'),
      q('uefi','¿Qué afirmación describe UEFI y BIOS legado?',['Son tecnologías diferentes de firmware; UEFI es habitual en equipos actuales.','Son dos sistemas de archivos.','Son dos nombres técnicos del mismo sistema.','UEFI es una partición de Windows.'],'a','BIOS se utiliza coloquialmente como término general, pero BIOS legado y UEFI tienen arquitecturas y funciones diferentes.'),
      q('levels','¿Qué relación existe entre GPT y NTFS?',['Son formatos alternativos para el mismo nivel.','GPT organiza carpetas y NTFS divide el disco.','GPT organiza las particiones; NTFS organiza los archivos de un volumen.','GPT solo funciona si todos los volúmenes son NTFS.'],'c','Un disco GPT puede contener particiones con distintos sistemas de archivos; la partición EFI del ejemplo usa FAT32.'),
      q('mbr','En el ejemplo con tres primarias y '+c.logical+' unidades lógicas dentro de una extendida, ¿cuántas unidades de datos hay?',[String(4+c.logical),String(3+c.logical),c.logical===3?'4':'3',String(c.logical)],'b','Se suman las tres primarias y las unidades lógicas. La extendida es el contenedor y no se suma como otra unidad de datos.'),
      q('raw','Has creado un volumen nuevo sin formatearlo. ¿Qué falta para copiar archivos a ese volumen vacío?',['Cambiar GPT por UEFI.','Ampliar el volumen hasta ocupar todo el disco.','Ponerle la letra C.','Crear un sistema de archivos mediante el formateo.'],'d','Crear la partición reserva una zona. Formatear prepara su sistema de archivos. RAW indica aquí que aún no hay uno utilizable.'),
      q('space','¿Cuál es la diferencia entre espacio libre y espacio sin asignar?',['Libre está dentro de un volumen; sin asignar no pertenece a una partición.','Son siempre lo mismo.','Sin asignar es una carpeta vacía.','Libre está fuera del disco.'],'a','El espacio libre puede guardar archivos dentro del volumen; para utilizar el espacio sin asignar hay que crear una partición o ampliar una contigua.'),
      q('backup','¿Qué copia protege mejor frente a la avería física del disco de origen?',['Otra carpeta en el mismo volumen.','Otra partición del mismo disco.','Una copia comprobada en otro dispositivo físico.','Una partición recién formateada y vacía.'],'c','Las particiones de un disco comparten el dispositivo físico. Una avería de ese disco puede afectar a todas.'),
      q('fat','Un vídeo de '+c.movie+' GB no se copia a un USB FAT32 de 32 GB con espacio suficiente. ¿Por qué?',['Porque MBR impide guardar vídeos.','Por el límite de tamaño de cada archivo en FAT32.','Porque todos los USB deben usar NTFS.','Porque el nombre del archivo contiene una tilde.'],'b','FAT32 admite como máximo 4.294.967.295 bytes por archivo; disponer de más espacio libre no aumenta ese límite.'),
      q('exchange','¿Qué formato permite el intercambio nativo con lectura y escritura en Windows y macOS de archivos mayores de 4 GB?',['ext4.','FAT32.','APFS.','exFAT.'],'d','exFAT admite archivos grandes y ambos sistemas lo leen y escriben de forma nativa.'),
      q('native','¿Qué asociación de usos nativos es adecuada?',['NTFS: Windows; ext4: Linux; APFS: macOS.','NTFS: Linux; ext4: macOS; APFS: Windows.','NTFS, ext4 y APFS solo sirven para cámaras.','Todos permiten lo mismo en cualquier sistema.'],'a','Estas son asociaciones habituales, aunque un sistema operativo puede acceder a otros formatos con soporte o herramientas adicionales.'),
      q('extend','En este gestor de discos básicos, ¿qué necesita un volumen NTFS para ampliarse conservando sus archivos?',['Espacio libre en cualquier USB conectado.','Formatear la partición de al lado.','Espacio sin asignar inmediatamente a su derecha en el mismo disco.','Una partición extendida MBR vacía en otro disco.'],'c','La ubicación del espacio importa. Reducir el volumen de al lado crea espacio después de ese volumen, y no elimina el obstáculo.'),
      q('format','¿Qué ocurre al formatear un volumen con archivos, incluso con formato rápido?',['Se conservan siempre los documentos.','Se prepara un sistema de archivos y los archivos anteriores dejan de estar disponibles normalmente.','Su espacio pasa a estar sin asignar.','El disco físico se divide automáticamente en dos.'],'b','Formatear mantiene la partición pero sustituye/prepara la organización del volumen. El formato rápido no es una copia de seguridad ni un borrado seguro.')
    ];
  }
  function comparisonBank() {
    return [
      {pair:'BIOS legado y UEFI',answer:'Ambos son tecnologías de firmware que actúan antes del sistema operativo. BIOS legado es la tecnología histórica; UEFI es la habitual en equipos actuales, con una arquitectura y servicios modernos. La etiqueta coloquial BIOS no los convierte en lo mismo.'},
      {pair:'MBR y GPT',answer:'Ambos organizan las particiones del disco. MBR tiene cuatro entradas principales y puede usar una extendida con lógicas; GPT usa una tabla moderna, muchas entradas y discos grandes. GPT no necesita la extendida de MBR.'},
      {pair:'NTFS y APFS',answer:'Ambos organizan archivos dentro de un volumen. NTFS es habitual en Windows y ofrece sus permisos; APFS es el formato moderno de Apple, pensado especialmente para SSD y con instantáneas. No son intercambiables de forma nativa entre Windows y macOS.'},
      {pair:'FAT32 y exFAT',answer:'Ambos pueden usarse en dispositivos externos. FAT32 lo reconocen muchos aparatos antiguos, pero limita cada archivo a 4.294.967.295 bytes. exFAT admite archivos mayores y lectura y escritura nativas en Windows y macOS, aunque un aparato antiguo puede no reconocerlo.'},
      {pair:'NTFS y ext4',answer:'Son sistemas de archivos. NTFS es habitual en Windows, con permisos de ese sistema; ext4 es habitual en Linux, con permisos Unix. Ambos admiten archivos grandes y registro de metadatos, pero su uso nativo depende del sistema operativo.'},
      {pair:'disco físico y partición',answer:'El disco es el dispositivo, como un SSD. Una partición es una división lógica dentro de él. Varias particiones no equivalen a varios dispositivos y pueden verse afectadas por la misma avería física.'},
      {pair:'particionar y formatear',answer:'Particionar define divisiones del disco. Formatear crea o prepara el sistema de archivos de una partición. Un volumen nuevo RAW ya ocupa una zona, pero necesita un sistema de archivos para copiar documentos; formatear uno con datos puede hacer que dejen de estar disponibles.'},
      {pair:'espacio libre y espacio sin asignar',answer:'El espacio libre está dentro de un volumen y se puede usar para archivos. El espacio sin asignar está fuera de las particiones: puede servir para crear un volumen o ampliar uno contiguo. Una partición vacía sigue siendo una partición.'},
      {pair:'reducir y extender un volumen',answer:'Reducir disminuye el tamaño del volumen y libera espacio sin asignar después de él. Extender aumenta su tamaño usando espacio sin asignar inmediatamente a su derecha, en el mismo disco básico. Pueden conservar los archivos; en equipos reales se hace copia antes.'},
      {pair:'copiar archivos y formatear un volumen',answer:'Copiar añade archivos al destino y mantiene el origen. Formatear prepara un sistema de archivos y los archivos anteriores de ese volumen dejan de estar disponibles normalmente. El formato rápido tampoco sustituye una copia.'},
      {pair:'formatear y eliminar un volumen',answer:'Formatear mantiene la partición y prepara su sistema de archivos. Eliminar quita el volumen y su zona pasa a estar sin asignar. En ambos casos los archivos anteriores dejan de estar disponibles normalmente.'},
      {pair:'copiar en otra partición del mismo disco y copiar en otro dispositivo físico',answer:'Ambas copias pueden duplicar archivos, pero dos particiones comparten el dispositivo. Si ese disco se avería, ambas pueden quedar inaccesibles. Una copia comprobada en otro dispositivo puede seguir disponible frente a la avería del origen.'},
      {pair:'esquema de particiones y sistema de archivos',answer:'MBR o GPT indican dónde están las particiones del disco. NTFS, exFAT u otro sistema organizan archivos dentro de un volumen. Un mismo disco GPT puede contener una partición EFI FAT32 y una partición de Windows NTFS.'},
      {pair:'firmware y sistema operativo',answer:'El firmware está en memoria no volátil de la placa e inicializa hardware y localiza un cargador antes del sistema operativo. El sistema operativo gestiona programas, usuarios y archivos una vez iniciado. UEFI y Windows son ejemplos de niveles distintos.'},
      {pair:'un volumen RAW y un volumen NTFS',answer:'RAW indica que Windows no reconoce un sistema de archivos utilizable; NTFS es un sistema de archivos que organiza documentos y permisos. En un volumen nuevo y vacío puede faltar el formateo; si antes había datos y ahora aparece RAW, se detienen las escrituras y se valora su recuperación.'},
      {pair:'letra de unidad y etiqueta de volumen',answer:'La letra, por ejemplo D:, forma parte de rutas como D:\\Documento.pdf. La etiqueta es un nombre descriptivo, por ejemplo Archivo. Cambiar la etiqueta no cambia la letra; cambiar la letra conserva archivos, pero puede afectar a rutas que la utilizan.'}
    ];
  }
  function finalQuestions(state) {
    const item=comparisonBank()[CASES.indexOf(config(state.caseId))];
    return [{id:'comparison',text:'Explica con tus propias palabras la diferencia entre '+item.pair+'. Añade un ejemplo relacionado con la práctica.',pair:item.pair,answer:item.answer}];
  }
  function resetActivity(state,stage=state.stage) {
    if(!Number.isInteger(stage)||stage<0||stage>6)throw new Error('Actividad no válida.');
    const keys={1:['firmware','physical','partitions','system','scheme','windowsFs','noLetter'],2:['primaryUnits','primaryAdd','mbrEntries','logicalUnits','gptUnits','needsExtended','six','large','schemeWhy']};
    for(const key of keys[stage]||[])delete state.answers[key];
    if(stage===3){state.disks=clone(state.initialDisks);state.challenge.disks=clone(state.challenge.initialDisks);state.workArea='guided';state.tool='disks';}
    if(stage===4)state.formatTests={};
    if(stage===5)for(const [id,t] of Object.entries(state.incidentTests)) {
      if(t.active)state.incidentTests[id]={...t,why:t.submittedWhy||t.why,reflection:''};
      else delete state.incidentTests[id];
    }
    if(stage===6){state.quizAnswers={};state.finalAnswers={};}
    delete state.hints[stage];delete state.feedback[stage];
    const entry=record(state,'activity-reset','Reiniciada la actividad '+stage+'. Se conserva el historial de operaciones'+(stage===5?' y las decisiones ya ejecutadas.':'.'),'info');
    state.activityEpochs=state.activityEpochs||{};state.activityEpochs[stage]=entry.id;
    return state;
  }
  function validateSave(value) {
    const fail=message=>{throw new Error(message);};
    if(!value||value.app!=='DiscoLab'||![1,2,VERSION].includes(value.version)) fail('Este archivo no es un progreso de DiscoLab compatible.');
    if(!CASES.some(c=>c.id===value.caseId))fail('El código de caso no es válido.');
    const base=createState(value.caseId);
    if(!Array.isArray(value.disks)||value.disks.length!==4)fail('El archivo no contiene los cuatro discos de la práctica.');
    const allLetters=[],allPartIds=[];
    for(const expected of base.disks) {
      const d=value.disks.find(x=>x.id===expected.id);
      if(!d||d.mib!==expected.mib||d.scheme!==expected.scheme||d.number!==expected.number||d.protected!==expected.protected||!Array.isArray(d.parts)||!d.parts.length||d.parts.length>128)fail('La estructura de un disco no es válida.');
      if(d.parts.reduce((n,p)=>n+p.mib,0)!==d.mib)fail('Los tamaños de las particiones no coinciden con el disco.');
      if(expected.protected&&JSON.stringify(d.parts)!==JSON.stringify(expected.parts))fail('Las particiones del sistema están modificadas en el archivo.');
      for(const p of d.parts) {
        if(!Number.isSafeInteger(p.mib)||p.mib<1||!['volume','unallocated','reserved'].includes(p.type)||typeof p.id!=='string'||p.id.length>100||allPartIds.includes(p.id))fail('Hay una partición no válida.');
        allPartIds.push(p.id);
        const fixed=expected.parts.find(x=>x.type==='reserved'&&x.id===p.id);
        if(p.type==='reserved'&&(!fixed||JSON.stringify(p)!==JSON.stringify(fixed)))fail('Hay una partición reservada no válida.');
        if(p.type==='volume') {
          if(!['NTFS','exFAT','FAT32','RAW'].includes(p.fs)||typeof p.label!=='string'||p.label.length>32||!Array.isArray(p.files)||p.files.length>1000)fail('El volumen contiene datos no válidos.');
          if(p.letter&&(!/^[A-Z]$/.test(p.letter)||allLetters.includes(p.letter)))fail('Hay letras de unidad repetidas o no válidas.');
          if(p.letter)allLetters.push(p.letter);
          const ids=new Set();
          for(const f of p.files){if(typeof f.id!=='string'||typeof f.name!=='string'||f.name.length>200||!Number.isSafeInteger(f.mib)||f.mib<1||ids.has(f.id))fail('Hay un archivo simulado no válido.');ids.add(f.id);}
          if(used(p)>p.mib||!Number.isFinite(p.minFloor)||p.minFloor<0||p.minFloor>p.mib)fail('El contenido del volumen supera su capacidad.');
          if(p.fs==='RAW'&&p.files.length)fail('Un volumen RAW contiene archivos imposibles.');
          if(p.fs==='FAT32'&&p.files.some(f=>f.mib*MIB>4294967295))fail('Hay archivos que exceden el límite de FAT32.');
        }
      }
      if(expected.parts.some(p=>p.type==='reserved'&&!d.parts.some(x=>x.id===p.id)))fail('Falta una partición reservada.');
    }
    for(const key of ['answers','finalAnswers','formatTests','incidentTests','hints'])if(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key]))fail('Falta una parte del progreso.');
    const answerObjects=[value.answers,value.finalAnswers];
    if(answerObjects.some(obj=>Object.values(obj).some(v=>typeof v!=='string'||v.length>12000)))fail('Hay respuestas no válidas o demasiado largas.');
    if(typeof value.names!=='string'||value.names.length>2000||typeof value.group!=='string'||value.group.length>100)fail('Los datos del alumnado no son válidos.');
    if(!Array.isArray(value.operations)||value.operations.length>2000||value.operations.some(o=>!o||!Number.isSafeInteger(o.id)||typeof o.message!=='string'||o.message.length>15000||!['ok','error','info'].includes(o.status)||typeof o.type!=='string'||!o.details||typeof o.details!=='object'))fail('El registro de operaciones no es válido.');
    if(!Number.isInteger(value.stage)||value.stage<0||value.stage>6||!Number.isSafeInteger(value.seq)||value.seq<0)fail('La posición del progreso no es válida.');
    for(const t of Object.values(value.formatTests))if(!t||typeof t!=='object'||typeof (t.why||'')!=='string'||String(t.why||'').length>12000||typeof (t.message||'')!=='string')fail('Las pruebas de formatos no son válidas.');
    for(const t of Object.values(value.incidentTests)){
      if(!t||typeof t!=='object'||typeof (t.why||'')!=='string'||String(t.why||'').length>12000||typeof (t.message||'')!=='string'||(t.after&&!Array.isArray(t.after)))fail('Las incidencias no son válidas.');
      if(t.after)for(const d of t.after){if(!d||typeof d.id!=='string'||typeof d.name!=='string'||!Number.isFinite(d.mib)||!Array.isArray(d.parts)||d.parts.length>128)fail('La configuración de una incidencia no es válida.');for(const p of d.parts)if(!p||!Number.isFinite(p.mib)||!['volume','reserved','unallocated'].includes(p.type)||(p.files&&!Array.isArray(p.files)))fail('Hay una partición de incidencia no válida.');}
    }
    for(const o of value.operations){if(o.details.files&&!Array.isArray(o.details.files))fail('El registro de archivos no es válido.');if(o.details.lostFiles&&!Array.isArray(o.details.lostFiles))fail('El registro de pérdidas no es válido.');if(o.details.steps&&(!Array.isArray(o.details.steps)||o.details.steps.some(s=>!s||typeof s.message!=='string')))fail('Los pasos de una incidencia no son válidos.');}
    const clean=clone(value);
    clean.quizAnswers=clean.quizAnswers||{};clean.activityEpochs=clean.activityEpochs||{};
    if(Object.values(clean.quizAnswers).some(v=>typeof v!=='string'||!['a','b','c','d'].includes(v)))fail('Hay respuestas del test no válidas.');
    if(Object.values(clean.activityEpochs).some(v=>!Number.isSafeInteger(v)||v<0))fail('Hay reinicios de actividad no válidos.');
    if(!clean.quizAnswers||typeof clean.quizAnswers!=='object'||Array.isArray(clean.quizAnswers)||typeof clean.activityEpochs!=='object'||Array.isArray(clean.activityEpochs))fail('El progreso del cuestionario no es válido.');
    if(value.version<3){clean.legacyFinalAnswers={...(clean.legacyFinalAnswers||{}),...clone(clean.finalAnswers)};clean.finalAnswers={};}
    for(const t of Object.values(clean.incidentTests)){
      if(typeof (t.reflection||'')!=='string'||String(t.reflection||'').length>12000||typeof (t.submittedWhy||'')!=='string'||String(t.submittedWhy||'').length>12000)fail('Hay reflexiones de incidencia no válidas.');
      if(t.active)t.submittedWhy=t.submittedWhy||t.why||'';
    }
    if(clean.legacyFinalAnswers&&(typeof clean.legacyFinalAnswers!=='object'||Array.isArray(clean.legacyFinalAnswers)||Object.values(clean.legacyFinalAnswers).some(v=>typeof v!=='string'||v.length>12000)))fail('Las respuestas conservadas de la versión anterior no son válidas.');
    const unitText=v=>String(v||'').replace(/\b([KMGTPE])iB\b/g,'$1B');
    for(const t of Object.values(clean.formatTests))if(t.message)t.message=unitText(t.message);
    for(const [id,t] of Object.entries(clean.incidentTests)){
      if(t.message)t.message=unitText(t.message);
      const scenario=incidentCases(base).find(i=>i.id===id);
      if(t.after&&scenario)for(const d of t.after){const expected=scenario.disks.find(x=>x.id===d.id);if(expected)d.name=expected.name;}
    }
    for(const o of clean.operations){o.message=unitText(o.message);if(o.details.message)o.details.message=unitText(o.details.message);if(o.details.steps)for(const step of o.details.steps)step.message=unitText(step.message);}
    clean.challenge=clean.challenge||clone(base.challenge);
    validateChallenge(clean.challenge,base.challenge,fail);
    clean.challenge.initialDisks=clone(base.challenge.initialDisks);
    for(const d of clean.challenge.disks)d.name=base.challenge.disks.find(x=>x.id===d.id).name;
    clean.workArea=['guided','independent'].includes(clean.workArea)?clean.workArea:'guided';
    clean.version=VERSION;clean.initialDisks=base.initialDisks;for(const d of clean.disks)d.name=base.disks.find(b=>b.id===d.id).name;clean.feedback={};clean.tool=['disks','files'].includes(clean.tool)?clean.tool:'disks';clean.seq=Math.max(clean.seq,...clean.operations.map(o=>o.id),0);return clean;
  }
  function validateChallenge(value,base,fail) {
    if(!value||!Array.isArray(value.disks)||value.disks.length!==2)fail('Faltan los discos del ejercicio autónomo.');
    const ids=new Set(),lettersSeen=new Set();
    for(const expected of base.disks){
      const d=value.disks.find(x=>x.id===expected.id);
      if(!d||d.mib!==expected.mib||d.number!==expected.number||d.scheme!=='GPT'||!Array.isArray(d.parts)||!d.parts.length||d.parts.length>128||d.parts.reduce((n,p)=>n+p.mib,0)!==d.mib)fail('La estructura del ejercicio autónomo no es válida.');
      for(const fixed of expected.parts.filter(p=>p.type==='reserved'))if(JSON.stringify(d.parts.find(p=>p.id===fixed.id))!==JSON.stringify(fixed))fail('Se ha modificado una reserva del ejercicio autónomo.');
      for(const p of d.parts){
        if(!p||typeof p.id!=='string'||p.id.length>100||ids.has(p.id)||!Number.isSafeInteger(p.mib)||p.mib<1||!['volume','reserved','unallocated'].includes(p.type))fail('Una zona del ejercicio autónomo no es válida.');
        ids.add(p.id);
        if(p.type==='reserved'&&!expected.parts.some(x=>x.type==='reserved'&&x.id===p.id))fail('Hay una reserva desconocida.');
        if(p.type!=='volume')continue;
        if(!['NTFS','exFAT','FAT32','RAW'].includes(p.fs)||typeof p.label!=='string'||p.label.length>32||!Array.isArray(p.files)||p.files.length>1000||!Number.isFinite(p.minFloor)||p.minFloor<0||p.minFloor>p.mib)fail('Un volumen del ejercicio autónomo no es válido.');
        if(p.letter&&(!/^[A-Z]$/.test(p.letter)||lettersSeen.has(p.letter)))fail('Las letras del ejercicio autónomo no son válidas.');
        if(p.letter)lettersSeen.add(p.letter);
        const files=new Set();for(const f of p.files){if(typeof f.id!=='string'||typeof f.name!=='string'||f.name.length>200||!Number.isSafeInteger(f.mib)||f.mib<1||files.has(f.id))fail('Un archivo del ejercicio autónomo no es válido.');files.add(f.id);}
        if(used(p)>p.mib||(p.fs==='RAW'&&p.files.length)||(p.fs==='FAT32'&&p.files.some(f=>f.mib*MIB>4294967295)))fail('El contenido no cabe en el volumen del ejercicio autónomo.');
      }
    }
  }
  const API={CASES,VERSION,G,MIB,clone,fmt,size,config,createState,challengeConfig,workState,getPart,snapshot,used,letters,capabilities,shrinkMax,perform,record,filesystemFacts,formatCases,testFormat,incidentBank,incidentCases,testIncident,checks,completion,quizQuestions,comparisonBank,finalQuestions,resetActivity,validateSave,textNorm};
  root.DiscoLabCore=API;
  if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
