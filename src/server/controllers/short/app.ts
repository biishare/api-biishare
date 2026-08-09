import * as create from './Create'
import * as getShorts from './Get'
import * as update from './Update'
import * as deleteToque from './Delete'
import * as getToqueById from './GetById'
import * as savedToques from './Saved'

export const ShortController = {
    ...create,
    ...getShorts,
    ...update,
    ...deleteToque,
    ...getToqueById,
    ...savedToques
}