import sys

path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx"

with open(path, "r") as f:
    content = f.read()

old = """      } else if (selectedFormType === 'honorarium') {
        dataToSave.form_type = 'honorarium';
        dataToSave.category = 'Honorarium';
        // Auto-fill core fields for compatibility
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.participation_type = formData.nature_of_participation || formData.participation_type;
        dataToSave.lecture_type = formData.lecture_type;
        dataToSave.honorarium_basis = formData.honorarium_basis;
        dataToSave.num_presences = Number(formData.number_of_presences || 0);
        dataToSave.rate = Number(formData.rate || 0);
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.total || formData.amount || 0);
        dataToSave.presences_unit = formData.presences_unit;
        dataToSave.honorarium_as_per_norms = formData.honorarium_as_per_norms;
        dataToSave.claimant_signature = formData.claimant_signature;
      }"""

new = """      } else if (selectedFormType === 'honorarium') {
        if (!formData.pay_level) {
          setError('Pay Level is required. Please select a pay level.');
          setSaving(false);
          return;
        }
        dataToSave.form_type = 'honorarium';
        dataToSave.category = 'Honorarium';
        // Auto-fill core fields for compatibility
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.pay_level = formData.pay_level;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.participation_type = formData.nature_of_participation || formData.participation_type;
        dataToSave.lecture_type = formData.lecture_type;
        dataToSave.honorarium_basis = formData.honorarium_basis;
        dataToSave.num_presences = Number(formData.number_of_presences || 0);
        dataToSave.rate = Number(formData.rate || 0);
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.total || formData.amount || 0);
        dataToSave.presences_unit = formData.presences_unit;
        dataToSave.honorarium_as_per_norms = formData.honorarium_as_per_norms;
        dataToSave.claimant_signature = formData.claimant_signature;
      }"""

if old not in content:
    print("ERROR: Target block not found. Already patched or line endings differ.")
    sys.exit(1)

with open(path + ".bak", "w") as f:
    f.write(content)

content = content.replace(old, new, 1)

with open(path, "w") as f:
    f.write(content)

print("Done. Backup saved to RecordModal.jsx.bak")
