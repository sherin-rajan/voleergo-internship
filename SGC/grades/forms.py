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

    marks_obtained = forms.IntegerField(
        required=False,
        min_value=0
    )

    def __init__(self, *args, **kwargs):
        self.student = kwargs.pop('student', None)
        selected_subject = kwargs.pop('selected_subject', None)

        super().__init__(*args, **kwargs)

        if selected_subject:
            self.fields['subject'].queryset = (
                self.fields['subject'].queryset.filter(
                    pk=selected_subject.pk
                )
            )
            self.initial['subject'] = selected_subject

    class Meta:
        model = StudentMark
        fields = ['subject', 'exam_status', 'marks_obtained']

    def clean(self):
        cleaned_data = super().clean()

        exam_status = cleaned_data.get('exam_status')
        marks = cleaned_data.get('marks_obtained')
        subject = cleaned_data.get('subject')

        # Prevent duplicate subject entries
        if self.student and subject:
            existing = StudentMark.objects.filter(
                student=self.student,
                subject=subject
            )

            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                self.add_error(
                    'subject',
                    'Marks for this subject have already been entered.'
                )

        if exam_status == 'present':
            if marks is None:
                self.add_error(
                    'marks_obtained',
                    'Please enter marks for a present student.'
                )
            elif subject and marks > subject.max_marks:
                self.add_error(
                    'marks_obtained',
                    f'Marks cannot exceed {subject.max_marks}.'
                )

        elif exam_status == 'absent':
            cleaned_data['marks_obtained'] = None

        return cleaned_data


