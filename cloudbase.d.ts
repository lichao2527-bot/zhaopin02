declare module '@cloudbase/js-sdk' {
  interface DatabaseCommand {
    eq: (value: any) => any;
    gt: (value: any) => any;
    gte: (value: any) => any;
    lt: (value: any) => any;
    lte: (value: any) => any;
    in: (values: any[]) => any;
    and: (...conditions: any[]) => any;
    or: (...conditions: any[]) => any;
  }

  interface CollectionReference {
    doc(docId?: string): DocumentReference;
    where(condition: any): Query;
    get(): Promise<{ data: any[] }>;
    add(data: any): Promise<any>;
  }

  interface DocumentReference {
    set(data: any): Promise<any>;
    update(data: any): Promise<any>;
    remove(): Promise<any>;
    get(): Promise<{ data: any[] }>;
  }

  interface Query {
    get(): Promise<{ data: any[] }>;
    remove(): Promise<any>;
    update(data: any): Promise<any>;
  }

  interface Database {
    collection(collectionName: string): CollectionReference;
    command: DatabaseCommand;
  }

  interface CloudBaseApp {
    database(): Database;
  }

  interface CloudBaseInitOptions {
    env: string;
  }

  function init(options: CloudBaseInitOptions): CloudBaseApp;

  export default init;
}
