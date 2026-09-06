import * as create from './Create'
import * as getShorts from './Get'
import * as update from './Update'
import * as deleteToque from './Delete'
import * as getToqueById from './GetById'
import * as savedToques from './Saved'
import * as social from './Social'
import * as context from './Context'

export const ShortController = {
    ...create,
    ...getShorts,
    ...update,
    ...deleteToque,
    ...getToqueById,
    ...savedToques,
    ...social,
    ...context
}