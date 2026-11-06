const generatedId = (function () {
    let counter = 0;
    return () => {
        return `report-${counter++}`
    }
})();

const TYPE = ['lost', 'found'];
const PET_TYPE = ['cat', 'dog', 'bird', 'other'];

const REPORT_RULES = [
    {
        field: 'type',
        check: (value, data) => typeof value === 'string' && value.trim().length > 0 && TYPE.includes(value),
        message: 'Type must be a non-empty string or  does not match type'
    },
    {
        field: 'petName',
        check: (value, data) => typeof value === 'string' && value.trim().length > 0,
        message: 'petName must be a non-empty string'
    },
    {
        field: 'petType',
        check: (value, data) => typeof value === 'string' && value.trim().length > 0 && PET_TYPE.includes(value),
        message: 'pet type must be a non-empty string or  does not match type'
    },
    {
        field: 'location',
        check: (value, data) => typeof value === 'string' && value.trim().length > 0,
        message: 'location must be a non-empty string'
    }, {
        field: 'contact',
        check: (value, data) => typeof value === 'string' && value.trim().length > 0,
        message: 'contact  must be a non-empty string'
    },
    {
        field: 'details',
        check: (value, data) => typeof value === 'string' && value.trim().length > 0,
        message: 'details must be a non-empty string'
    },
    {
        field: 'photoUrl',
        check: (value, data) => value === undefined || value === null
            ? true
            : typeof value === 'string' && value.trim().length > 0,
        message: 'photoUrl must be a non-empty string'
    },
];


class Validator {
    constructor(rules) {
        this.rules = rules
    }

    validate(formData) {
        const valid = {valid: true, errors: []};

        if (!this.rules.length) return valid

        if (!Object.values(formData).length) {
            valid.valid = false;
            this.rules.forEach((rule) => {
                if (!rule.check(formData[rule.field])) {
                    valid.errors.push(rule.message);
                }

            })
            return valid
        }
        if (!this.rules) {
            return {valid: true, errors: []}
        }
        for (const key in formData) {

            const field = this.rules.find((item) => item.field === key);
            if (field) {
                if (!field.check(formData[key], formData)) {
                    valid.valid = false;
                    valid.errors.push(field.message)
                }
            } else {
                valid.valid = false;
                valid.errors.push(`field ${key} is invalid`);
            }
        }

        return valid
    }
}

const validator = new Validator(REPORT_RULES)

console.log('FIRST VALIDATION', validator.validate({}))
// { valid: false, errors: [ ...6 messages... ] }  photoUrl passes when absent

console.log('SECOND VALIDATION', validator.validate({
    type: 'lost', petType: 'dog', petName: 'Rex',
    details: 'Brown labrador', location: 'Yerevan', contact: '099123456'
}))
// { valid: true, errors: [] }

console.log('THIRD VALIDATION', validator.validate({
    type: 'lost', petType: 'dog', petName: '   ',
    details: 'x', location: 'y', contact: 'z'
}))
// { valid: false, errors: ['petName must be a non-empty string'] }

// A different rule set — the same Validator class
const looseValidator = new Validator([REPORT_RULES[0]])   // only checks 'type'
console.log('looseValidator', looseValidator.validate({type: 'lost'}))

// { valid: true, errors: [] }

class Report {
    constructor(data) {
        this.id = generatedId()
        this.type = data.type
        this.petType = data.petType
        this.petName = data.petName
        this.details = data.details
        this.photoUrl = data.photoUrl
        this.location = data.location
        this.contact = data.contact
        this.createdAt = new Date()
    }

    get age() {
        return new Date() - this.createdAt.getTime();
    }

    get summary() {
        const typeUpperCase = this.type.toUpperCase();
        return `[${typeUpperCase}] ${this.petName} (${this.petType}) — ${this.location}`;
    }

    toString() {
        return this.summary
    }

    toJSON() {
        return {...this}
    }
}


const r = new Report({
    type: 'lost', petType: 'dog', petName: 'Rex',
    details: 'Brown labrador', location: 'Yerevan', contact: '099123456'
})

console.log(r.summary)            // [LOST] Rex (dog) — Yerevan
console.log(`second ${r}`)               // [LOST] Rex (dog) — Yerevan  (toString, implicit)
console.log(typeof r.age)         // 'number'
console.log(r.toJSON())           // plain object, createdAt is an ISO string
console.log('photoUrl' in r.toJSON())   // false — omitted when undefined

// Getter is an accessor on the prototype, not a value on the instance
console.log('hasOwnProperty', r.hasOwnProperty('age'))                    // false
console.log(r.hasOwnProperty('petName'))                // true
console.log(Object.getOwnPropertyDescriptor(Report.prototype, 'age'))

// { get: [Function: age], set: undefined, enumerable: false, configurable: true
class FoundReport extends Report {
    constructor(data) {
        super(data);
        this.type = 'found'
    }

    markAsReunited() {
        return {
            ...this.toJSON(),
            status: 'reunited',
            reunitedAt: new Date()
        }
    }
}

class LostReport extends Report {
    constructor(data) {
        super(data);
        this.type = 'lost';
    }

    markAsFound(extraData = {}) {
        return new FoundReport({
            ...this.toJSON(),
            ...extraData
        })
    }
}


const lost = new LostReport({
    petType: 'cat', petName: 'Luna', details: 'Grey tabby',
    location: 'Mashtots Park', contact: '077999888'
})

console.log(`${lost}`)                   // [LOST] Luna (cat) — Mashtots Park
console.log(lost instanceof LostReport)  // true
console.log(lost instanceof Report)      // true
console.log(lost instanceof FoundReport) // false

const found = lost.markAsFound({details: 'Found near the fountain'})
console.log(found instanceof FoundReport)  // true
console.log(found.petName)                 // Luna — carried over
console.log(found.details)                 // Found near the fountain — overridden
console.log(found.id === lost.id)          // false — new record
console.log(lost.type)                     // 'lost' — original unchanged

const reunited = found.markAsReunited()
console.log(reunited.status)                   // 'reunited'
console.log(reunited instanceof FoundReport)   // false — plain object


// Link 1 — instance side (same as Phase 1)
console.log(Object.getPrototypeOf(lost) === LostReport.prototype)              // true
console.log(Object.getPrototypeOf(LostReport.prototype) === Report.prototype)  // true
console.log(Object.getPrototypeOf(Report.prototype) === Object.prototype)      // true

// Link 2 — static side (NEW in Phase 2, extends sets this up for free)
console.log(Object.getPrototypeOf(LostReport) === Report)                      // true

// constructor is correct with no manual fix
console.log(lost.constructor === LostReport)        // true
console.log(lost.constructor.name)                  // 'LostReport'


class ReportRepository {
    value = ''

    constructor(validator) {
        this.validator = validator
        this._reports = []   // still underscore convention — real privacy arrives in Phase 3
    }

    add(data) {

        const result = this.validator.validate(data);
        if (!result.valid) {
            throw new Error('Invalid report data: ' + result.errors.join(', '));
        }

        const record = data.type === 'lost' ? new LostReport(data) : new FoundReport(data);
        this._reports[record.id] = record;
        return record;
    }

    delete(id) {
        if (this._reports[id]) {
            delete this._reports[id]
            return true
        }
        return false
    }

    findAll(args = {}) {
        const results = [];
        for (const item of Object.values(this._reports)) {
            const matches = Object.entries(args).every(([key, value]) => item[key] === value);
            if (matches) results.push(item);
        }
        return results;
    }

    findById(id) {
        return this._reports[id] ? this._reports[id] : undefined;
    }

    get size() {
        return Object.values(this._reports).length;
    }
}

const repo = new ReportRepository(new Validator(REPORT_RULES))

const r1 = repo.add({
    type: 'lost', petType: 'dog', petName: 'Rex',
    details: 'Brown labrador', location: 'Yerevan', contact: '099123456'
})
const r2 = repo.add({
    type: 'found', petType: 'cat', petName: 'Luna',
    details: 'Grey tabby', location: 'Mashtots Park', contact: '077999888'
})
const r3 = repo.add({
    type: 'lost', petType: 'dog', petName: 'Buddy',
    details: 'Golden retriever', location: 'Komitas', contact: '055111222'
})
console.log('SIZE', repo.size)                                 // 3
console.log(r1 instanceof LostReport)                  // true
console.log(r2 instanceof FoundReport)                 // true
console.log(repo.findAll().length)                     // 3
console.log(repo.findAll({type: 'lost'}).length)     // 2
console.log(repo.findAll({petType: 'dog'}).length)   // 2
console.log(repo.findAll({type: 'lost', petType: 'dog'}).length)  // 2
console.log(repo.findById(r1.id) === r1)               // true — same instance


console.log('start remove', repo.delete(r2.id))      // true
console.log(repo.size)               // 2
console.log(repo.delete('nope'))     // false

try {
    repo.add({type: 'lost', petName: ''})
} catch (e) {
    console.log(e.message.startsWith('Invalid report data:'))  // true
    console.log(e instanceof Error)                            // true
}

// Returned array is a copy
const results = repo.findAll()
results.push('garbage')

console.log('size', repo.size)   // 2 — internal array untouched

// Composition: swap the validator, repository code unchanged
const lenientRepo = new ReportRepository(new Validator([]))
console.log(lenientRepo.add({type: 'lost'}) instanceof LostReport)  // true — no rules, no


const sample = new LostReport({
    petType: 'bird', petName: 'Kiwi',
    details: 'Green parrot', location: 'Arabkir', contact: '091000111'
})

console.log(Object.getPrototypeOf(sample) === LostReport.prototype)             // true
console.log(Object.getPrototypeOf(LostReport.prototype) === Report.prototype)   // true
console.log(Object.getPrototypeOf(Report.prototype) === Object.prototype)       // true
console.log(sample.hasOwnProperty('petName'))                                   // true
console.log(sample.hasOwnProperty('toString'))                                  // false
console.log(Object.getOwnPropertyNames(Report.prototype))
// ['constructor', 'age', 'summary', 'toString', 'toJSON']




