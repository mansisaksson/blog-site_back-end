import * as mongoose from 'mongoose';

export interface IRead<T> {
	findById(id: string): Promise<T>
	findOne(cond?: Object): Promise<T>
	find(cond: Object, limit: number, sort?: Object): Promise<T[]>
}

export interface IWrite<T> {
	create(item: T): Promise<T>
	update(_id: mongoose.Types.ObjectId, item: T): Promise<any>
	delete(_id: string): Promise<any>
}

export class RepositoryBase<T extends mongoose.Document> implements IRead<T>, IWrite<T> {
	protected _model: mongoose.Model<mongoose.Document>;

	constructor(schemaModel: mongoose.Model<mongoose.Document>) {
		this._model = schemaModel;
	}

	async create(item: T): Promise<T> {
		return <T>await this._model.create(item)
	}

	update(_id: mongoose.Types.ObjectId, item: T): Promise<boolean> {
		return new Promise<any>((resolve) => {
			let callback = (error: any) => {
				if (error) {
					console.error(error)
					resolve(false)
				}
				else {
					resolve(true) 
				}
			}
			this._model.update({ _id: _id }, item, callback);
		})
	}

	delete(_id: string): Promise<boolean> {
		return new Promise<any>((resolve) => {
			let callback = (error: any) => {
				if (error) { 
					console.error(error)
					resolve(false) 
				}
				else { resolve(true) }
			}
			this._model.remove({ _id: this.toObjectId(_id) }, callback);
		})
	}

	deleteAll(_ids: string[]): Promise<boolean> {
		return new Promise<any>((resolve) => {
			let callback = (error: any) => {
				if (error) { 
					console.log(error)
					resolve(false) 
				}
				else { resolve(true) }
			}
			let objectIds = []
			_ids.forEach(id => objectIds.push(this.toObjectId(id)))
			this._model.remove({ _id: { $in: objectIds } }, callback);
		})
	}

	remove(cond: Object): Promise<boolean> {
		return new Promise<any>((resolve) => {
			let callback = (error: any) => {
				if (error) { 
					console.log(error)
					resolve(false) 
				}
				else { resolve(true) }
			}
			this._model.remove(cond, callback);
		})
	}

	findById(_id: string): Promise<T> {
		return new Promise<T>((resolve) => {
			if (!_id) {
				return resolve(null)
			}
			let callback = (error: any, result: T) => {
				if (error) { 
					console.log(error)
					resolve(null) 
				}
				else { resolve(result) }
			}
			this._model.findById(this.toObjectId(_id), callback);
		})
	}

	findByIds(_ids: string[]): Promise<T[]> {
		return new Promise<T[]>((resolve) => {
			let callback = (err: any, res: T[]) => {
				if (err) { 
					console.log(err)
					resolve(null)
				}
				else { resolve(res) }
			}
			let objectIds = []
			_ids.forEach(id => objectIds.push(this.toObjectId(id)))
			this._model.find({ _id: { $in: objectIds } }).exec(callback)
		})
	}

	findOne(cond?: Object): Promise<T> {
		return new Promise<T>((resolve) => {
			let callback = (err: any, res: T) => {
				if (err) { 
					console.log(err)
					resolve(null) 
				}
				else { resolve(res) }
			}
			this._model.findOne(cond, callback);
		})
	}

	find(cond: Object, limit: number, sort?: Object): Promise<T[]> {
		return new Promise<T[]>((resolve) => {
			let callback = (err: any, res: T[]) => {
				if (err) { 
					console.log(err)
					resolve(null) 
				}
				else { resolve(res) }
			}
			this._model.find(cond).sort(sort).limit(limit).exec(callback)
		})
	}

	protected toObjectId(_id: string): mongoose.Types.ObjectId {
		return mongoose.Types.ObjectId.createFromHexString(_id);
	}

	protected isId(_id: string): boolean {
		// a mongoose Id is a 24 char hex string
		let regex = new RegExp('^[0-9a-fA-F]+$')
		if (_id.length == 24 && regex.test(_id)) {
			return true
		}
		return false
	}
}
