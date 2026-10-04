export function incomePlanMonth(month:string,currency:string){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||Number(month.slice(0,4))<1900||Number(month.slice(0,4))>9998||!['USD','CAD'].includes(currency))throw new Error('Choose a valid month and currency');return month;}
export function incomePlanFigures(expected:number|null,received:number,budgeted:number){
 const cents=(n:number)=>Math.round(n*100),r=cents(received),b=cents(budgeted),e=expected===null?null:cents(expected);
 return {expected,received,stillExpected:e===null?null:Math.max(0,e-r)/100,abovePlan:e===null?null:Math.max(0,r-e)/100,plannedLeftToBudget:e===null?null:(e-b)/100};
}
