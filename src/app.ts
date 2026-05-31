import { server } from "./server/Server";

const port = process.env.PORT
server.listen(port, () => {
    console.log('Hello World: ', port);
});