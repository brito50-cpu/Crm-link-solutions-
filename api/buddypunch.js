const RESOURCES={employees:'/employee',locations:'/location',jobCodes:'/departmentCode',geofences:'/geofence'};
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const auth=req.headers.authorization||'';
  if(!auth.startsWith('Bearer '))return res.status(401).json({error:'Sign in required'});
  const sbUrl=process.env.VITE_SUPABASE_URL||'https://woqdroyrdqqnexrouzyi.supabase.co';
  const sbKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_GXoY_gOCe_r2LJYYmgrBqg_qsrCq0Go';
  if(!sbKey)return res.status(503).json({error:'Server auth configuration missing'});
  try{
    const verify=await fetch(`${sbUrl}/auth/v1/user`,{headers:{apikey:sbKey,Authorization:auth}});
    if(!verify.ok)return res.status(401).json({error:'Invalid session'});
    const user=await verify.json();
    const profile=await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,active,role`,{headers:{apikey:sbKey,Authorization:auth}});
   if (!profile.ok) {
  return res.status(403).json({
    error: 'CRM profile verification failed'
  });
}

const profiles = await profile.json();

const isAdmin = profiles.some(p => {
  const role = String(p.role || '')
    .toLowerCase()
    .replace(/[\s/_-]/g, '');

  return p.active === true &&
    ['owner', 'admin', 'owneradmin'].includes(role);
});

if (!isAdmin) {
  return res.status(403).json({
    error: 'Admin access required'
  });
}
    const key=process.env.BUDDYPUNCH_API_KEY;
    if(!key)return res.status(503).json({error:'Buddy Punch secret missing from this deployment'});
    const result={};
    for(const [name,path] of Object.entries(RESOURCES)){
      const response=await fetch(`https://api2.buddypunch.com${path}?limit=1`,{headers:{Authorization:`Bearer ${key}`,'X-Api-Version':'2025-03-01'},signal:AbortSignal.timeout(8000)});
      if(response.ok){const body=await response.json();result[name]={ok:true,count:body.totalCount??body.data?.length??0};}
      else result[name]={ok:false,error:response.status===403?'Permission not granted':`Buddy Punch returned ${response.status}`};
    }
    return res.status(200).json(result);
  }catch(e){return res.status(502).json({error:'Secure connection test failed'});}
}
