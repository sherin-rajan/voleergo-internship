from django import forms
from django.forms import inlineformset_factory
from .models import Student, Subject, StudentMark


class StudentForm(forms.ModelForm):

    class Meta:
        model = Student
        fields = ['name', 'roll_number']

class SubjectForm(forms.ModelForm):

    class Meta:
        model = Subject
        fields = ['name', 'max_marks', 'pass_marks']

class StudentMarkForm(forms.ModelForm):

    class Meta:
        model = StudentMark
        fields = ['subject', 'marks_obtained']

    def clean_marks_obtained(self):
        marks = self.cleaned_data['marks_obtained']
        subject = self.cleaned_data.get('subject')

        if subject and marks > subject.max_marks:
            raise forms.ValidationError(
                f'Marks cannot exceed {subject.max_marks}.'
            )

        return marks