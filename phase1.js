const generateId = (function () {
    let counter = 0;
    return function () {
        return 'report-' + (++counter)
    }
})()

generateId()

const REQUIRED_REPORT_KEYS = ["type", "petType", "petName", "details", "photoUrl", "location", "contact"];
const TYPE = ['lost', 'found'];
const PET_TYPE = ['cat', 'dog', 'bird', 'other'];

function validate(formData) {
    const error = {valid: true, errors: []}

    if (!formData) return error;

    const reportKey = REQUIRED_REPORT_KEYS.find(key => !(key in formData))

    if (reportKey) {
        error.valid = false;
        error.errors.push(`field ${reportKey} is missing`)
        return error;
    }

    const type = formData.type.trim().toLowerCase();
    const reportType = TYPE.includes(type);

    const petType = formData.petType.trim().toLowerCase();
    const reportPetType = PET_TYPE.includes(petType);

    if (!reportPetType) {
        error.valid = false;
        error.errors.push(`Pet type ${petType} does not exist`);
    }

    if (!reportType) {
        error.valid = false;
        error.errors.push(`type ${type} does not exist`);
    }

    for (const [key, value] of Object.entries(formData)) {
        if (key !== 'photoUrl' && (value.trim() === '' || value.trim() === undefined || value.trim() === null)) {
            error.valid = false;
            error.errors.push(`${key} is required`)
        }
    }

    return error
}

console.log('validate', validate({
    type: 'lost', petType: "dog", petName: 'Miki', photoUrl: '',
    location: 'Yerevan', contact: 'Yerevan', details: 'Brown labrador'
}))

function Report(report) {
    this.id = generateId();
    this.type = report.type;
    this.petType = report.petType;
    this.petName = report.petName;
    this.details = report.details;
    this.photoUrl = report.photoUrl ? report.photoUrl : '';
    this.location = report.location;
    this.contact = report.contact;
    this.createdAt = new Date().toISOString();
}

Report.prototype.toString = function () {
    const typeUpperCase = this.type.toUpperCase();
    return `[${typeUpperCase}] ${this.petName} (${this.petType}) — ${this.location}`;
};

Report.prototype.toJSON = function () {
    return {...this};
};

Report.prototype.getAge = function () {
    return new Date() - new Date(this.createdAt);
};

const r = new Report({
    type: 'lost', petType: 'dog', petName: 'Rex',
    details: 'Brown labrador', location: 'Yerevan', contact: '099123456'
})


console.log(r.toString())       // [LOST] Rex (dog) — Yerevan
console.log(r.toJSON())         // plain object, createdAt is ISO string
console.log(typeof r.getAge())  // 'number'

// Prototype checks
console.log(r.hasOwnProperty('petName'))   // true  — set in constructor
console.log(r.hasOwnProperty('toString'))  // false — lives on prototype
console.log(Object.getPrototypeOf(r) === Report.prototype)  // true


function LostReport(data) {
    Report.call(this, {...data, type: 'lost'});
}

LostReport.prototype = Object.create(Report.prototype);
LostReport.prototype.constructor = LostReport;

LostReport.prototype.markAsFound = function (extraData = {}) {
    return new FoundReport({
        ...this.toJSON(),
        ...extraData
    });
};

function FoundReport(data) {
    Report.call(this, {...data, type: 'found'});
}

FoundReport.prototype = Object.create(Report.prototype);
FoundReport.prototype.constructor = FoundReport;

FoundReport.prototype.markAsReunited = function () {
    return {
        ...this.toJSON(),
        status: 'reunited',
        reunitedAt: new Date()
    };
};



const lost = new LostReport({
    petType: 'cat', petName: 'Luna', details: 'Grey tabby',
    location: 'Mashtots Park', contact: '077999888'
})

console.log(lost instanceof LostReport)  // true
console.log(lost instanceof Report)      // true
console.log(lost instanceof FoundReport) // false
console.log(lost.toString())             // [LOST] Luna (cat) — Mashtots Park

const found = lost.markAsFound({details: 'Found near the fountain'})

console.log(found instanceof FoundReport) // true
console.log(found instanceof LostReport)  // false
console.log(found.petName)                // Luna — carried over
console.log(found.id === lost.id)         // false — new record

const reunited = found.markAsReunited()
console.log(reunited.status)    // 'reunited'
console.log(reunited instanceof FoundReport)  // false — plain object

function ReportRepository() {
    this._reports = new Map();
}

ReportRepository.prototype.add = function (data) {
    const validateReport = validate(data)

    if (validateReport.errors.length) {
        throw new Error('Invalid report data: ' + validateReport.errors.join(', '))
    }

    const record = data.type === 'lost' ? new LostReport(data) : new FoundReport(data);
    this._reports.set(record.id, record);
    return record;

}

ReportRepository.prototype.findById = function (id) {
    return this._reports.has(id) ? this._reports.get(id) : undefined;
}

ReportRepository.prototype.findAll = function (args = {}) {
    const results = [];
    for (const item of this._reports.values()) {
        const matches = Object.entries(args).every(([key, value]) => item[key] === value);
        if (matches) results.push(item);
    }
    return results;
}

ReportRepository.prototype.delete = function (id) {
    return this._reports.delete(id)
}

Object.defineProperty(ReportRepository.prototype, 'count', {
    get: function () {
        return this._reports.size
    },
    enumerable: true,
    configurable: true
})


const repo = new ReportRepository()

const r1 = repo.add({
    type: 'lost', petType: 'dog', petName: 'Rex', photoUrl: "",
    details: 'Brown labrador', location: 'Yerevan', contact: '099123456'
})
const r2 = repo.add({
    type: 'found', petType: 'cat', petName: 'Luna', photoUrl: "",
    details: 'Grey tabby', location: 'Mashtots Park', contact: '077999888'
})
const r3 = repo.add({
    type: 'lost', petType: 'dog', petName: 'Buddy', photoUrl: "",
    details: 'Golden retriever', location: 'Komitas', contact: '055111222'
})

console.log(repo.count)              // 3
console.log(repo.findAll().length)   // 3
console.log(repo.findAll({type: 'lost'}).length)    // 2
console.log(repo.findAll({petType: 'dog'}).length)  // 2
console.log(repo.findAll({type: 'lost', petType: 'dog'}).length)  // 2

const byId = repo.findById(r1.id)
console.log(byId === r1)             // true — same instance

console.log('repo.delete', repo.delete(r2.id))      // true
console.log(repo.count)              // 2
console.log(repo.delete('fake-id'))  // false

// Validate error
try {
    repo.add({type: 'lost', petName: ''})
} catch (e) {
    console.log(e.message.startsWith('Invalid report data:'))  // true
}



