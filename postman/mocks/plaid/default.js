// Local contract stand-in based on Plaid's documented request/response shapes.
// Control endpoints are test-only and are not part of Plaid's API.
const http = require('node:http');
const month = new Date().toISOString().slice(0,7);
const transaction = (id, amount, primary, extra={}) => ({transaction_id:id,account_id:'acct-checking',amount,iso_currency_code:'USD',date:`${month}-10`,name:id,merchant_name:id,pending:false,pending_transaction_id:null,personal_finance_category:primary?{primary,detailed:primary,confidence_level:'HIGH'}:null,...extra});
let scenario='normal';
let page=0;
const accounts=[{account_id:'acct-checking',name:'Sandbox checking',mask:'0000',type:'depository',subtype:'checking',balances:{current:4200,available:4100,iso_currency_code:'USD'}}];
http.createServer(async(req,res)=>{
  let raw=''; for await(const chunk of req)raw+=chunk;
  const body=req.body||JSON.parse(raw||'{}');
  res.setHeader('Content-Type','application/json');
  const send=(code,value)=>{res.statusCode=code;res.end(JSON.stringify(value));};
  if(req.url==='/test/control'){scenario=body.scenario||'normal';page=0;return send(200,{scenario});}
  if(!body.client_id||!body.secret)return send(400,{error_code:'MISSING_FIELDS'});
  if(req.url==='/link/token/create'){if(body.products?.[0]!=='transactions'||!body.user?.client_user_id)return send(400,{error_code:'INVALID_FIELD'});return send(200,{link_token:'link-sandbox-test'});}
  if(req.url==='/item/public_token/exchange'){if(!body.public_token)return send(400,{error_code:'MISSING_FIELDS'});return send(200,{access_token:'access-sandbox-fake',item_id:'item-sandbox-fake'});}
  if(!body.access_token)return send(400,{error_code:'MISSING_FIELDS'});
  if(req.url==='/accounts/get')return send(200,{accounts,item:{institution_id:'ins_109508'}});
  if(req.url==='/item/remove')return send(200,{removed:true});
  if(req.url==='/transactions/sync'){
    if(scenario==='failure')return send(503,{error_code:'INTERNAL_SERVER_ERROR'});
    if(scenario==='login')return send(400,{error_code:'ITEM_LOGIN_REQUIRED'});
    if(scenario==='page-failure'){
      if(!body.cursor||body.cursor!=='partial')return send(200,{added:[transaction('should-not-commit',100,'GENERAL_MERCHANDISE')],modified:[],removed:[],next_cursor:'partial',has_more:true});
      return send(503,{error_code:'INTERNAL_SERVER_ERROR'});
    }
    if(scenario==='mutation'&&page++===0)return send(400,{error_code:'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION'});
    if(scenario==='posted')return send(200,{added:[transaction('posted-purchase',25,'GENERAL_MERCHANDISE',{pending_transaction_id:'pending-purchase'})],modified:[],removed:[{transaction_id:'pending-purchase'}],next_cursor:'posted',has_more:false});
    if(scenario==='removed')return send(200,{added:[],modified:[],removed:[{transaction_id:'posted-purchase'}],next_cursor:'removed',has_more:false});
    return send(200,{added:[transaction('card-purchase',50,'FOOD_AND_DRINK'),transaction('card-repayment',50,'LOAN_PAYMENTS'),transaction('payroll',-2000,'INCOME'),transaction('ambiguous-store',12,null),transaction('pending-purchase',25,'GENERAL_MERCHANDISE',{pending:true}),transaction('unknown-credit',-30,null)],modified:[],removed:[],next_cursor:'base',has_more:false});
  }
  send(501,{error_code:'ENDPOINT_NOT_MODELED'});
}).listen(process.env.PORT||4011);
