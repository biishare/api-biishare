import * as create from './Create' 
import * as getAds from './Get' 
// import * as deleteShort from './Delete' 
import * as getAdById from './GetById' 


export const AdController = {
    ...create,
    ...getAds,
//     ...deleteShort,
    ...getAdById
}