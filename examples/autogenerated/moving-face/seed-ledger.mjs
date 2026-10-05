// One-time F1 seed; anatomy/musculature.tsv is the canonical editable ledger.
// Refuses to overwrite that ledger. Coordinates are approximate millimetres.
import {writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const rows = [];
function add(id, name, origin, insertion, pull, skin, bone, effect, nerve,
             origin_point, insertion_point, radius, field='pull', jaw='0;0;0',
             hyoid='0;0', disposition='independent', reason='Distinct fiber field',
             visibility='external', source='face', laterality='paired') {
  rows.push({id,canonical_name:name,laterality,origin_region:origin,insertion_region:insertion,
    principal_pull:pull,affected_tissue:skin,skeletal_structure:bone,effect,innervation:nerve,
    model_actuators:disposition==='excluded'?'none':id,
    disposition,reason,visibility,origin_point,insertion_point,influence_radius:radius,
    field,jaw_coefficients:jaw,hyoid_coefficients:hyoid,source});
}
const VII='VII facial', V3='V3 trigeminal', C1='C1 via XII', X='X pharyngeal plexus';
add('frontalis_medial','Occipitofrontalis frontal belly - medial','galea','medial brow skin','superior','medial brow/forehead','none','skin',VII,'20;85;35','20;50;54','24;42;30');
add('frontalis_lateral','Occipitofrontalis frontal belly - lateral','galea','lateral brow skin','superior','lateral brow/forehead','none','skin',VII,'46;85;30','46;48;46','25;40;30');
add('occipitalis','Occipitofrontalis occipital belly','superior nuchal line/mastoid','galea','posterior','posterior scalp/galea','none','skin',VII,'35;75;-58','35;85;-38','35;40;30','pull','0;0;0','0;0','excluded','Posterior scalp lies outside the current anterior mask; galea tension not yet transmitted','external','scalp');
add('temporoparietalis','Temporoparietalis','temporal fascia','galea/auricular fascia','superior','temporal scalp/auricle','none','skin',VII,'70;72;5','72;45;8','25;35;30');
add('corrugator_supercilii','Corrugator supercilii','medial superciliary arch','medial brow dermis','medial/inferior','medial brow','none','skin',VII,'9;43;54','24;50;52','23;22;25');
add('depressor_supercilii','Depressor supercilii','medial orbital margin','medial brow','inferior','medial brow','none','skin',VII,'15;35;55','19;50;54','15;23;22');
add('procerus','Procerus','nasal bone fascia','glabella skin','inferior','glabella/nasal root','none','skin',VII,'0;23;65','0;51;57','22;28;24','pull','0;0;0','0;0','independent','Midline glabella actuator','external','face','unpaired');
for (const [id,name,p,kind,r] of [
 ['palpebral_upper','palpebral upper','33;38;56','lid_upper','27;17;18'],
 ['palpebral_lower','palpebral lower','33;27;56','lid_lower','27;17;18'],
 ['orbital_superior','orbital superior','33;50;52','eye_ring','32;30;25'],
 ['orbital_inferior','orbital inferior','33;19;56','eye_ring','32;30;25']])
 add('orbicularis_oculi_'+id,'Orbicularis oculi - '+name,'medial orbital ligament','eyelid/periorbital dermis','circumferential toward aperture','eyelids/periorbital skin','none','compression/skin',VII,'33;33;57',p,r,kind);
add('orbicularis_oculi_lacrimal','Orbicularis oculi - lacrimal','posterior lacrimal crest','medial tarsal/tear apparatus','posteromedial','medial eyelid','none','compression',VII,'14;33;48','14;33;56','12;14;18','pull','0;0;0','0;0','grouped','Absorbed into same-side palpebral upper field; tear pump has no independent geometry','external','orbit');
rows.at(-1).model_actuators='orbicularis_oculi_palpebral_upper';
add('levator_palpebrae_superioris','Levator palpebrae superioris','lesser sphenoid wing','superior tarsus/upper eyelid','superior','upper eyelid','none','skin','III oculomotor','33;58;45','33;38;56','27;18;20','lid_raise','0;0;0','0;0','independent','Antagonist of upper palpebral closure','external','orbit');
add('superior_tarsal','Superior tarsal smooth muscle','levator aponeurosis','superior tarsus','superior','upper eyelid','none','skin','sympathetic','33;48;49','33;38;56','27;18;20','lid_raise','0;0;0','0;0','grouped','Small tonic lid contribution shares levator field','external','orbit');
rows.at(-1).model_actuators='levator_palpebrae_superioris';
add('nasalis_transverse','Nasalis - transverse','maxilla beside nose','dorsal nasal aponeurosis','medial','nasal sidewall/nostril','none','compression/skin',VII,'0;5;78','14;5;73','19;25;26');
add('nasalis_alar','Nasalis - alar','maxilla above lateral incisor','alar cartilage/skin','lateral/inferior','nasal ala/nostril','none','skin',VII,'28;-3;64','15;1;76','18;18;26');
add('depressor_septi_nasi','Depressor septi nasi','maxillary incisor fossa','mobile septum/nasal base','inferior','columella/upper lip','none','skin',VII,'0;-26;69','0;0;83','18;26;28','pull','0;0;0','0;0','independent','Midline nasal base/lip coupling','external','face','unpaired');
add('levator_labii_superioris_alaeque_nasi','Levator labii superioris alaeque nasi','frontal process maxilla','ala/upper lip','superior','nasal ala and upper lip','none','skin',VII,'15;29;68','15;-18;71','19;37;27');
add('levator_labii_superioris','Levator labii superioris','infraorbital maxilla','upper lip','superior','upper lip','none','skin',VII,'27;16;64','19;-25;69','24;36;27');
add('zygomaticus_minor','Zygomaticus minor','anterior zygoma','upper lip','superolateral','upper lip/nasolabial fold','none','skin',VII,'46;20;55','23;-25;69','28;40;32');
add('zygomaticus_major','Zygomaticus major','lateral zygoma','modiolus','superolateral','mouth corner/cheek','none','skin',VII,'58;12;47','29;-31;63','38;43;32','modiolus');
add('levator_anguli_oris','Levator anguli oris','canine fossa maxilla','modiolus','superior','mouth corner','none','skin',VII,'31;0;63','29;-31;63','28;32;25','modiolus');
add('risorius','Risorius','parotid/masseteric fascia','modiolus','lateral','mouth corner/lateral cheek','none','skin',VII,'68;-29;31','29;-31;63','40;27;38','modiolus');
add('buccinator','Buccinator','molar alveoli/pterygomandibular raphe','modiolus/oral fibers','toward teeth with corner tension','cheek','none','compression/skin',VII,'47;-23;34','47;-23;58','30;37;33','cheek_compress');
for(const [id,p,r] of [
 ['upper_medial','10;-26;72','19;18;24'],['upper_lateral','24;-27;67','20;20;24'],
 ['lower_medial','10;-36;73','19;18;24'],['lower_lateral','24;-35;67','20;20;24']])
 add('orbicularis_oris_'+id,'Orbicularis oris - '+id.replace('_',' '),'perioral fibrous network/modiolus','lip dermis/mucosa','circumferential/inward with protrusion','lips','none','compression/skin',VII,'0;-31;69',p,r,'lip_ring');
for(const [id,p,target] of [['superioris','12;-26;71','upper_medial'],['inferioris','12;-36;72','lower_medial']]) {
 add('incisivus_labii_'+id,'Incisivus labii '+id,'incisor alveolar bone','oral orbicular/modiolus network','medial/protrusive','lip','none','skin',VII,'4;-31;62',p,'20;20;24','lip_ring','0;0;0','0;0','grouped','Short incisive fibers share matching medial oral field; retained as distinct anatomical input');
 rows.at(-1).model_actuators='orbicularis_oris_'+target;
}
add('depressor_anguli_oris','Depressor anguli oris','mandibular oblique line','modiolus','inferolateral','mouth corner','none','skin',VII,'42;-67;51','29;-31;63','30;35;28','modiolus');
add('depressor_labii_inferioris','Depressor labii inferioris','mandibular oblique line','lower lip','inferolateral','lower lip','none','skin',VII,'24;-65;64','14;-37;72','24;32;25');
add('mentalis','Mentalis','mandibular incisor fossa','chin dermis','superior/anterior','chin/lower lip','none','skin/compression',VII,'10;-42;73','10;-63;66','25;30;27','mentalis');
add('platysma_mandibular','Platysma - mandibular sheet','upper thorax superficial fascia','lower mandible/skin','inferior','jawline/anterior neck','mandible','skin/jaw',VII,'42;-130;25','43;-73;49','43;65;32','pull','0.08;0;0');
add('platysma_lower_lip','Platysma - oral fibers','upper thorax superficial fascia','lower lip/modiolus','inferior','lower lip/anterior neck','none','skin',VII,'38;-115;28','27;-36;64','32;40;29','modiolus');
for(const [id,o,i,j] of [
 ['superficial','64;4;31','58;-61;29','-0.65;0.10;0'],
 ['intermediate','66;8;21','62;-47;19','-0.45;0;0'],
 ['deep','64;12;8','61;-31;8','-0.45;-0.04;0']])
 add('masseter_'+id,'Masseter - '+id,'zygomatic arch','lateral mandibular ramus/angle','superior; fibers differ by layer','masseter/ramus skin','mandible','jaw/bulge',V3,o,i,'30;43;42','bulge',j,'0;0','independent','Layer-specific axis and isochoric belly expansion','external','mastication');
for(const [id,o,j] of [
 ['anterior','47;81;18','-0.70;0;0'],['middle','64;57;-7','-0.45;-0.16;0'],
 ['posterior','67;29;-32','-0.12;-0.65;0']])
 add('temporalis_'+id,'Temporalis - '+id+' fan','temporal fossa/fascia','coronoid process','toward '+id+' temporal fan origin','temporal fossa skin','mandible','jaw/bulge',V3,o,'51;0;14','30;42;35','bulge',j,'0;0','independent','Posterior fan primarily retrudes; anterior primarily elevates','external','mastication');
for(const [id,o,j] of [['superficial','30;5;34','-0.30;0.16;-0.17'],['deep','24;17;21','-0.50;0.23;-0.25']])
 add('medial_pterygoid_'+id,'Medial pterygoid - '+id+' head','maxillary tuberosity/pterygoid fossa','medial mandibular angle','superior/anterior/medial','deep ramus tissues','mandible','jaw',V3,o,'48;-61;10','25;40;30','skeletal',j,'0;0','independent','Deep muscle drives mandible without speculative surface bulge','jaw_hyoid','mastication');
add('lateral_pterygoid_superior','Lateral pterygoid - superior head','greater sphenoid wing','TMJ disc/capsule/condylar complex','anteromedial','deep TMJ','mandible/disc','jaw',V3,'27;25;28','58;13;2','20;25;25','skeletal','-0.04;0.20;-0.15','0;0','independent','Approximate closing-phase disc stabilization and protrusive contribution; no disc mesh','jaw_hyoid','mastication');
add('lateral_pterygoid_inferior','Lateral pterygoid - inferior head','lateral pterygoid plate','condylar neck/fovea','anteromedial','deep TMJ','mandible','jaw',V3,'26;5;34','58;11;2','22;30;30','skeletal','0.12;0.60;-0.70','0;0','independent','Protrusion and contralateral excursion dominate opening','jaw_hyoid','mastication');
add('digastric_anterior','Digastric - anterior belly','mandibular digastric fossa','intermediate tendon/hyoid sling','inferoposterior with fixed hyoid','submental tissues','mandible/hyoid','jaw/hyoid',V3,'9;-98;18','9;-73;59','26;35;36','hyoid','0.65;0;0','0.55;0.25','independent','Opening requires infrahyoid stabilization; mobile hyoid instead elevates','jaw_hyoid/external','hyoid');
add('digastric_posterior','Digastric - posterior belly','mastoid notch','intermediate tendon/hyoid sling','superoposterior','submandibular tissues','hyoid','hyoid',VII,'62;-2;-13','16;-98;18','25;45;40','hyoid','0;0;0','0.55;-0.25','independent','Hyoid elevation/retraction; not a duplicate jaw opener','jaw_hyoid/external','hyoid');
add('mylohyoid','Mylohyoid','mandibular mylohyoid line','median raphe/hyoid','superior with free hyoid','floor of mouth/submental','mandible/hyoid','jaw/hyoid',V3,'23;-65;41','12;-95;24','35;35;40','hyoid','0.25;0;0','0.60;0.05','independent','Sling elevation or stabilized jaw depression','jaw_hyoid/external','hyoid');
add('geniohyoid','Geniohyoid','inferior mental spine','hyoid body','anterosuperior','submental/floor of mouth','mandible/hyoid','jaw/hyoid',C1,'6;-68;57','6;-98;18','28;37;42','hyoid','0.40;0;0','0.55;0.55','independent','Opening depends on hyoid fixation','jaw_hyoid/external','hyoid');
add('stylohyoid','Stylohyoid','styloid process','hyoid body','posterosuperior','submandibular tissues','hyoid','hyoid',VII,'49;0;-14','17;-98;18','28;42;42','hyoid','0;0;0','0.45;-0.40','independent','Elevates and retracts hyoid','jaw_hyoid/external','hyoid');
for(const [id,name,o,i,h] of [
 ['sternohyoid','Sternohyoid','12;-155;14','12;-98;18','-0.65;0'],
 ['omohyoid_superior','Omohyoid - superior belly','47;-137;6','18;-98;18','-0.40;-0.08'],
 ['sternothyroid','Sternothyroid','17;-155;8','17;-120;12','-0.25;0'],
 ['thyrohyoid','Thyrohyoid','18;-122;13','18;-98;18','-0.30;0']])
 add(id,name,id==='thyrohyoid'?'thyroid cartilage':'sternum/tendon fascia',id==='sternothyroid'?'thyroid cartilage':'hyoid body','inferior with lower attachment fixed','anterior neck','hyoid/larynx','hyoid',id==='thyrohyoid'?C1:'ansa cervicalis C1-C3',o,i,'32;45;36','hyoid','0;0;0',h,'independent','Approximate inferior support; larynx not independently meshed','jaw_hyoid/external','hyoid');
add('omohyoid_inferior','Omohyoid - inferior belly','superior scapular border','intermediate tendon','inferolateral tendon tension','low lateral neck','hyoid via tendon','hyoid','ansa cervicalis C1-C3','65;-155;-5','47;-137;6','30;40;30','hyoid','0;0;0','-0.30;0','grouped','Common tendon shares superior-belly stabilization actuator','jaw_hyoid','hyoid');
rows.at(-1).model_actuators='omohyoid_superior';
for(const [id,o,i] of [['anterior','69;23;31','80;17;11'],['superior','72;59;8','81;31;7'],['posterior','65;13;-18','81;15;3']])
 add('auricularis_'+id,'Auricularis '+id,'scalp fascia/mastoid','auricular cartilage',id,'auricle','none','skin',VII,o,i,'20;28;26','pull','0;0;0','0;0','independent','Coarse pinna displacement; intrinsic cartilage absent','external','ear');
for(const [id,o,i,pull] of [
 ['helicis_major','helical spine','anterior helix','shorten helix'],['helicis_minor','helical crus base','helical crus','compress crus'],
 ['tragicus','tragus base','tragus apex','compress tragus'],['antitragicus','antitragus','tail of helix/antihelix','fold antitragus'],
 ['transversus_auriculae','conchal eminence','scapha eminence','flatten posterior pinna'],['obliquus_auriculae','upper concha','upper pinna convexity','fold superior pinna']])
 add(id,id.replaceAll('_',' '),o,i,pull,'auricular cartilage/skin','none','skin/compression',VII,'80;20;7','82;22;9','10;15;10','none','0;0;0','0;0','excluded','Coarse pinna has no helix/tragus cartilage topology; independent shape effect deferred','external','ear');
for(const [id,name,o,i,pull] of [
 ['genioglossus','Genioglossus','superior mental spine','tongue body/hyoid','protrude/depress tongue'],
 ['hyoglossus','Hyoglossus','hyoid body/greater horn','tongue side','depress/retract tongue'],
 ['styloglossus','Styloglossus','styloid process','tongue side','retract/elevate tongue'],
 ['palatoglossus','Palatoglossus','palatine aponeurosis','posterior tongue','elevate tongue root/depress palate'],
 ['tongue_superior_longitudinal','Tongue superior longitudinal','submucosal tongue root','tongue tip/edges','shorten/curl tip up'],
 ['tongue_inferior_longitudinal','Tongue inferior longitudinal','tongue root','tongue tip','shorten/curl tip down'],
 ['tongue_transverse','Tongue transverse','median septum','lateral tongue','narrow/elongate tongue'],
 ['tongue_vertical','Tongue vertical','dorsal tongue','ventral tongue','flatten/widen tongue']])
 add(id,name,o,i,pull,'tongue/floor of mouth','hyoid for genioglossus/hyoglossus','soft-tissue',id==='palatoglossus'?X:'XII hypoglossal','8;-48;30','8;-40;52','25;25;30','none','0;0;0','0;0','excluded','Can change open-mouth view; tongue volume and attachment load coupling not yet represented','open_mouth/jaw_hyoid','tongue');
for(const [id,name,o,i,pull,nerve] of [
 ['tensor_veli_palatini','Tensor veli palatini','scaphoid fossa/auditory tube','palatine aponeurosis via hamulus','tension palate',V3],
 ['levator_veli_palatini','Levator veli palatini','petrous temporal bone/auditory tube','palatine aponeurosis','elevate palate',X],
 ['palatopharyngeus','Palatopharyngeus','hard palate/aponeurosis','pharyngeal wall/thyroid cartilage','elevate pharynx/depress palate',X],
 ['musculus_uvulae','Musculus uvulae','posterior nasal spine/aponeurosis','uvula mucosa','shorten/elevate uvula',X]])
 add(id,name,o,i,pull,'soft palate/uvula','larynx indirectly','soft-tissue',nerve,'8;-1;12','8;-22;21','20;20;20','none','0;0;0','0;0','excluded','Can change deep open-mouth view; no palate/uvula/pharyngeal mesh; outside current external-face fidelity','open_mouth','palate');
for(const [id,o,i] of [['sternal','sternal manubrium','mastoid/lateral nuchal line'],['clavicular','medial clavicle','mastoid/lateral nuchal line']])
 add('sternocleidomastoid_'+id,'Sternocleidomastoid - '+id+' head',o,i,'ipsilateral bend/contralateral turn','lateral upper neck','head','skin/head pose','XI accessory/C2-C3','40;-155;6','65;0;-11','35;85;35','none','0;0;0','0;0','excluded','Would alter neck silhouette and head pose; present demo fixes skull and lacks lateral neck muscle volumes','external','neck');
for(const [id,o,i] of [
 ['scalenus_anterior','C3-C6 transverse processes','first rib'],['scalenus_medius','C2-C7 transverse processes','first rib'],['scalenus_posterior','C4-C6 transverse processes','second rib'],
 ['trapezius_upper','occiput/nuchal ligament','clavicle/acromion'],['splenius_capitis','nuchal ligament/C7-T3 spines','mastoid/nuchal line'],
 ['semispinalis_capitis','upper thoracic/cervical processes','occiput'],['longus_capitis','C3-C6 transverse processes','basilar occiput'],
 ['longus_colli','cervical/upper thoracic bodies','cervical bodies/transverse processes'],['rectus_capitis_anterior','atlas lateral mass','basilar occiput'],
 ['rectus_capitis_lateralis','atlas transverse process','occipital jugular process'],['rectus_capitis_posterior_major','axis spinous process','inferior nuchal line'],
 ['rectus_capitis_posterior_minor','atlas posterior tubercle','inferior nuchal line'],['obliquus_capitis_superior','atlas transverse process','occiput'],
 ['obliquus_capitis_inferior','axis spinous process','atlas transverse process']])
 add(id,id.replaceAll('_',' '),o,i,'neck/head stabilization and rotation by fiber direction','upper neck','head/cervical spine','head pose',id==='trapezius_upper'?'XI accessory/C3-C4':'cervical spinal nerves','48;-100;-20','48;0;-30','35;70;35','none','0;0;0','0;0','excluded','Audited upper-neck boundary; skull pose fixed and posterior/deep neck geometry absent','external','neck');
for(const id of ['superior_rectus','inferior_rectus','medial_rectus','lateral_rectus','superior_oblique','inferior_oblique'])
 add(id,id.replaceAll('_',' '),'orbital apex except inferior oblique from orbital maxilla','sclera','rotate eyeball','eyeball/conjunctival appearance','none','gaze',id==='superior_oblique'?'IV trochlear':id==='lateral_rectus'?'VI abducens':'III oculomotor','33;33;25','33;33;58','20;20;20','none','0;0;0','0;0','excluded','Visible gaze requires independent eyeball rotation; fixed eyeballs in this muscle-deformation slice','external','orbit');
for(const [id,nerve] of [['tensor_tympani',V3],['stapedius',VII]])
 add(id,id.replaceAll('_',' '),'middle ear bone','auditory ossicle','middle-ear tension','middle ear','auditory ossicles','none',nerve,'65;12;0','65;12;1','1;1;1','none','0;0;0','0;0','excluded','No external or open-mouth surface effect at current fidelity','none','ear');
const path=root+'anatomy/musculature.tsv';
if(existsSync(path)) throw Error('Canonical ledger already exists; edit it directly');
mkdirSync(root+'anatomy',{recursive:true});
const keys=Object.keys(rows[0]);
writeFileSync(path,keys.join('\t')+'\n'+rows.map(r=>keys.map(k=>r[k]).join('\t')).join('\n')+'\n');
console.log('Seeded',rows.length,'canonical muscle/subdivision entries');
