import * as create from './Create'
import * as getPosts from './Get'
import * as getPostById from './GetById' 
import * as getPostFilters from './Filters' 
import * as update from './Update' 
import * as deletePost from './Delete' 

export const PostController = {
    ...create,
    ...getPosts,
    ...getPostFilters,
    ...getPostById,
    ...update,
    ...deletePost
}