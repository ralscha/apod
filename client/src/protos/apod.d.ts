import * as $protobuf from "protobufjs";

export interface IApod {
    date?: (string|null);
    explanation?: (string|null);
    title?: (string|null);
    credit?: (string|null);
}

export class Apod implements IApod {
    constructor(properties?: IApod);
    public date: string;
    public explanation: string;
    public title: string;
    public credit: string;
    public static create(properties?: IApod): Apod;
    public static encode(message: IApod, writer?: $protobuf.Writer): $protobuf.Writer;
    public static encodeDelimited(message: IApod, writer?: $protobuf.Writer): $protobuf.Writer;
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Apod;
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Apod;
    public static verify(message: { [k: string]: any }): (string|null);
    public static fromObject(object: { [k: string]: any }): Apod;
    public static toObject(message: Apod, options?: $protobuf.IConversionOptions): { [k: string]: any };
    public toJSON(): { [k: string]: any };
}

export interface IApods {
    apods?: (IApod[]|null);
}

export class Apods implements IApods {
    constructor(properties?: IApods);
    public apods: IApod[];
    public static create(properties?: IApods): Apods;
    public static encode(message: IApods, writer?: $protobuf.Writer): $protobuf.Writer;
    public static encodeDelimited(message: IApods, writer?: $protobuf.Writer): $protobuf.Writer;
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Apods;
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Apods;
    public static verify(message: { [k: string]: any }): (string|null);
    public static fromObject(object: { [k: string]: any }): Apods;
    public static toObject(message: Apods, options?: $protobuf.IConversionOptions): { [k: string]: any };
    public toJSON(): { [k: string]: any };
}
