from django.shortcuts import render,redirect,get_object_or_404
from .forms import StudentForm,SubjectForm,StudentMarkForm
from .models import Student, Subject, StudentMark
from .utils import calculate_student_result

# Create your views here.

def home(request):
    return render(request, 'home.html')

def add_student(request):
    if request.method == 'POST':
        form = StudentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')

    else:
        form = StudentForm()

    return render(request, 'add_student.html', {'form': form})


def add_subject(request):
    if request.method == 'POST':
        form = SubjectForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect('home')

    else:
        form = SubjectForm()

    return render(request, 'add_subject.html', {'form': form})

def student_list(request):
    students = Student.objects.all()

    return render(request, 'student_list.html', {
        'students': students
    })

def student_detail(request, id):
    student = get_object_or_404(Student, id=id)
    results = calculate_student_result(student)

    return render(request, 'student_detail.html', {
        'student': student,
        'result': results
    })

def add_student_mark(request, id):
    student = get_object_or_404(Student, id=id)

    if request.method == 'POST':
        form = StudentMarkForm(request.POST)

        if form.is_valid():
            mark = form.save(commit=False)
            mark.student = student
            mark.save()
            return redirect('student_detail', id=student.id)

    else:
        form = StudentMarkForm()

    return render(request, 'add_mark.html', {
        'form': form,
        'student': student
    })