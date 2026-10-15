function generateId() {
    const idName = 'report_'
    let incrementNum = 0;
    return () => {
        ++incrementNum;
        return idName + incrementNum
    }
}

const generateID = generateId()

function validate(formData) {
    const error = {valid: true, errors: []}
    for (const formDataKey in formData) {
        if (formData[formDataKey] === '') {
            error.valid = false;
            error.errors.push(`${formDataKey} is required`)
        }
    }
    return error
}

// console.log('validate', validate({
//     type: 'lost', petType: 'dog', petName: '',
//     location: 'Yerevan', contact: '', details: 'Brown labrador'
// }))

function Report(report) {
    this.id = generateID();
    this.type = report.type;
    this.petType = report.petType;
    this.petName = report.petName;
    this.details = report.details;
    this.location = report.location;
    this.contact = report.contact;
    this.createdAt = new Date().toISOString();
}

Report.prototype.toString = function () {
    const typeUpperCase = this.type.toUpperCase();
    return `[${typeUpperCase}] ${this.petName} (${this.petType}) - ${this.location} `;
};

Report.prototype.toJSON = function () {
    return {...this};
};

Report.prototype.getAge = function () {
    return new Date(this.createdAt).getMilliseconds();
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
console.log('typeof', typeof r.markAsFound);

function FoundReport(data) {
    Report.call(this, {...data, type: 'found'});
}


FoundReport.prototype = Object.create(Report.prototype);
FoundReport.prototype.constructor = FoundReport;

FoundReport.prototype.markAsReunited = function () {
    return {
        ...this.toJSON(),
        status: 'reunited',
        reunitedAt: new Date().toISOString()
    };
};


const lost = new LostReport({
    petType: 'cat', petName: 'Luna', details: 'Grey tabby',
    location: 'Mashtots Park', contact: '077999888'
})

// console.log("lost", lost.toJSON())
// console.log("LostReport", LostReport)
//
// console.log(lost instanceof LostReport)  // true
// console.log(lost instanceof Report)      // true
// console.log(lost instanceof FoundReport) // false
// console.log(lost.toString())             // [LOST] Luna (cat) — Mashtots Park
//
// const found = lost.markAsFound({details: 'Found near the fountain'})
//
// console.log(found instanceof FoundReport) // true
// console.log(found instanceof LostReport)  // false
// console.log(found.petName)                // Luna — carried over
// console.log(found.id === lost.id)         // false — new record
//
// const reunited = found.markAsReunited()
// console.log(reunited.status)    // 'reunited'
// console.log(reunited instanceof FoundReport)  // false — plain object

function ReportRepository() {
    this.data = []
}

ReportRepository.prototype.add = function (data) {
    const validateReport = validate(data)
    console.log("validateReport", validateReport)
    if (validateReport.errors.length) {
        throw new Error('Invalid report data: ' + validateReport.join(', '))
    }
    const record = data.type === 'lost' ? new LostReport(data).toJSON() : new FoundReport(data).toJSON();
    this.data.push(record);
    return record;

}

ReportRepository.prototype.findById = function (id) {
    return this.data.find((report) => report.id === id);
}

ReportRepository.prototype.findAll = function (args = {}) {

    // const filterEntries = Object.entries(args)
    //
    // if (filterEntries.length === 0) {
    //     return [...this.data];
    // }
    //
    // return this.data.filter((item) =>
    //     filterEntries.every(([key, value]) => item[key] === value)
    // );

    if (Object.keys(args)?.length) {
        const keys = Object.keys(args)
        const values = Object.values(args)
        const newData = [];
        this.data.forEach((item) => {
            const isAllExist = keys.every((key, index) => item[key] === values[index])
            if (isAllExist) {
                newData.push(item)
            }
        })
        return newData
    }
    return [...this.data]
}

ReportRepository.prototype.delete = function (id) {
    const isRemoved = this.data.filter((item) => item.id === id)
    return !!isRemoved.length;
}

Object.defineProperty(ReportRepository.prototype, 'count', {
    get: function () {
        return this.data.length
    },
    enumerable: true,
    configurable: true
})

const repo = new ReportRepository();

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

// console.log("ReportRepository.prototype", ReportRepository.prototype)
// console.log('FIRST COUNT', repo.count)              // 3
// console.log(repo.findAll())   // 3
//
// console.log('lost', repo.findAll({type: 'lost'}))    // 2
// console.log('petType', repo.findAll({petType: 'dog'}))  // 2
// console.log('lost pettype', repo.findAll({type: 'lost', petType: 'dog'}).length)  // 2
//
// const byId = repo.findById(r1.id)
// console.log("byId",byId)
// console.log(byId === r1)
//
// // true — same instance
//
// console.log("removed id", repo.delete(r2.id))      // true
// // 2
// console.log("removed id 2", repo.delete('fake-id'))  // false
//
// // Validate error
// try {
//     repo.add({type: 'lost', petName: ''})
//
// } catch (e) {
//     console.log(e.message.startsWith('Invalid report data:'))  // true
// }
