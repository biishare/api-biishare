import * as create from './Create' 
import * as getShorts from './Get' 
// import * as deleteShort from './Delete' 
import * as getToqueById from './GetById' 


export const ShortController = {
    ...create,
    ...getShorts,
//     ...deleteShort,
    ...getToqueById
}