export class ServerResponse {
    constructor(
        public responseCode: number,
        public responseMessage: string,
        private responseContent: any
     ) {}

    getContent(): any {
        return this.responseContent;
    }

    setContent(content: any) {
        this.responseContent = content;
    }
}